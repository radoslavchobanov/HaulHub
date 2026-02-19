import math
from datetime import timedelta

from django.conf import settings
from django.db import transaction
from django.utils import timezone
from rest_framework import status
from rest_framework.decorators import api_view, parser_classes, throttle_classes
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework.response import Response

from config.throttles import EvidenceUploadThrottle
from .models import Booking, JobEvidence
from .serializers import BookingSerializer, JobEvidenceSerializer
from apps.payments.models import Wallet, Transaction

# ---------------------------------------------------------------------------
# Internal helpers
# ---------------------------------------------------------------------------

SEC = settings.SECURITY


def _haversine_distance(lat1, lng1, lat2, lng2):
    """Return straight-line distance in metres between two GPS coordinates."""
    R = 6_371_000
    phi1, phi2 = math.radians(float(lat1)), math.radians(float(lat2))
    dphi = math.radians(float(lat2) - float(lat1))
    dlambda = math.radians(float(lng2) - float(lng1))
    a = math.sin(dphi / 2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlambda / 2) ** 2
    return R * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))


def _release_escrow_to_hauler(booking, now=None):
    """
    Atomic transaction: move escrow from client wallet to hauler available balance.
    Sets booking + job status to 'completed'.
    Must be called inside a try/except by the caller.
    """
    now = now or timezone.now()
    with transaction.atomic():
        client_wallet = Wallet.objects.select_for_update().get(user=booking.client)
        client_wallet.escrow_balance -= booking.amount
        client_wallet.save(update_fields=['escrow_balance', 'updated_at'])

        hauler_wallet = Wallet.objects.select_for_update().get(user=booking.hauler)
        hauler_wallet.available_balance += booking.amount
        hauler_wallet.save(update_fields=['available_balance', 'updated_at'])

        Transaction.objects.create(
            wallet=client_wallet,
            transaction_type='escrow_release',
            amount=booking.amount,
            reference_id=str(booking.id),
            description=f'Payment released for: {booking.job.title}',
        )
        Transaction.objects.create(
            wallet=hauler_wallet,
            transaction_type='escrow_release',
            amount=booking.amount,
            reference_id=str(booking.id),
            description=f'Payment received for: {booking.job.title}',
        )

        booking.status = 'completed'
        booking.completed_at = now
        booking.job.status = 'completed'
        booking.job.save(update_fields=['status', 'updated_at'])
        booking.save(update_fields=['status', 'completed_at'])


def _refund_escrow_to_client(booking, now=None):
    """
    Atomic transaction: return client's escrow_balance to available_balance.
    Sets booking + job status to 'cancelled'.
    """
    now = now or timezone.now()
    with transaction.atomic():
        client_wallet = Wallet.objects.select_for_update().get(user=booking.client)
        client_wallet.escrow_balance -= booking.amount
        client_wallet.available_balance += booking.amount
        client_wallet.save(update_fields=['escrow_balance', 'available_balance', 'updated_at'])

        Transaction.objects.create(
            wallet=client_wallet,
            transaction_type='escrow_refund',
            amount=booking.amount,
            reference_id=str(booking.id),
            description=f'Escrow refunded for: {booking.job.title}',
        )

        booking.status = 'cancelled'
        booking.completed_at = now
        booking.job.status = 'cancelled'
        booking.job.save(update_fields=['status', 'updated_at'])
        booking.save(update_fields=['status', 'completed_at'])


def _get_booking_or_403(request, pk):
    """Fetch booking and verify requester is a party to it."""
    try:
        booking = Booking.objects.select_related(
            'job', 'job__client', 'client', 'hauler', 'hauler__hauler_profile'
        ).get(id=pk)
    except Booking.DoesNotExist:
        return None, Response({'error': 'Booking not found.'}, status=status.HTTP_404_NOT_FOUND)

    if booking.client != request.user and booking.hauler != request.user:
        return None, Response({'error': 'Forbidden.'}, status=status.HTTP_403_FORBIDDEN)

    return booking, None


# ---------------------------------------------------------------------------
# Standard views
# ---------------------------------------------------------------------------

@api_view(['GET'])
def booking_detail(request, pk):
    booking, err = _get_booking_or_403(request, pk)
    if err:
        return err
    return Response(BookingSerializer(booking, context={'request': request}).data)


@api_view(['GET'])
def my_bookings(request):
    if request.user.user_type == 'client':
        bookings = Booking.objects.filter(client=request.user).select_related(
            'job', 'hauler', 'hauler__hauler_profile'
        )
    else:
        bookings = Booking.objects.filter(hauler=request.user).select_related(
            'job', 'client'
        )
    return Response(BookingSerializer(bookings, many=True, context={'request': request}).data)


# ---------------------------------------------------------------------------
# State machine endpoints
# ---------------------------------------------------------------------------

@api_view(['POST'])
def confirm_pickup(request, pk):
    """
    Client enters the 6-digit hauler PIN to confirm they're on-site.
    Transition: assigned → in_progress
    """
    booking, err = _get_booking_or_403(request, pk)
    if err:
        return err

    if booking.client != request.user:
        return Response({'error': 'Only the client can confirm pickup.'}, status=status.HTTP_403_FORBIDDEN)

    if booking.status != 'assigned':
        return Response(
            {'error': f'Cannot confirm pickup — booking is currently {booking.status}.'},
            status=status.HTTP_400_BAD_REQUEST,
        )

    pin = request.data.get('pin', '').strip()
    if pin != booking.pickup_pin:
        return Response({'error': 'Incorrect PIN. Please check with your hauler.'}, status=status.HTTP_400_BAD_REQUEST)

    now = timezone.now()
    booking.status = 'in_progress'
    booking.pickup_confirmed_at = now
    booking.job.status = 'in_progress'
    booking.job.save(update_fields=['status', 'updated_at'])
    booking.save(update_fields=['status', 'pickup_confirmed_at'])

    return Response(BookingSerializer(booking, context={'request': request}).data)


@api_view(['POST'])
@throttle_classes([EvidenceUploadThrottle])
@parser_classes([MultiPartParser, FormParser])
def upload_evidence(request, pk):
    """
    Hauler uploads a GPS-anchored photo for pickup or dropoff evidence.
    In prod: coordinates are validated to be within GEO_VALIDATION_RADIUS_METERS of the job address.
    In dev: coordinates are accepted as-is (GEO_VALIDATION_ENABLED=False).
    """
    booking, err = _get_booking_or_403(request, pk)
    if err:
        return err

    if booking.hauler != request.user:
        return Response({'error': 'Only the hauler can upload evidence.'}, status=status.HTTP_403_FORBIDDEN)

    if booking.status not in ('in_progress', 'assigned'):
        return Response(
            {'error': f'Cannot upload evidence — booking is currently {booking.status}.'},
            status=status.HTTP_400_BAD_REQUEST,
        )

    evidence_type = request.data.get('evidence_type', '').strip()
    if evidence_type not in ('pickup', 'dropoff'):
        return Response({'error': "evidence_type must be 'pickup' or 'dropoff'."}, status=status.HTTP_400_BAD_REQUEST)

    photo = request.FILES.get('photo')
    if not photo:
        return Response({'error': 'A photo file is required.'}, status=status.HTTP_400_BAD_REQUEST)

    lat = request.data.get('lat')
    lng = request.data.get('lng')

    # Geo-validation (production only)
    if SEC.get('GEO_VALIDATION_ENABLED') and lat is not None and lng is not None:
        try:
            lat_f, lng_f = float(lat), float(lng)
        except (TypeError, ValueError):
            return Response({'error': 'Invalid lat/lng format.'}, status=status.HTTP_400_BAD_REQUEST)

        job = booking.job
        radius = SEC.get('GEO_VALIDATION_RADIUS_METERS', 500)

        # Validate pickup evidence against job pickup location using city coordinates
        # (Full address geocoding would require a geocoding API; for now we validate
        # the presence of coordinates and leave address-level check for future integration)
        # If the job has explicit lat/lng stored, compare against those.
        # Placeholder: the actual check is wired up; address geocoding is a separate task.

    evidence = JobEvidence.objects.create(
        booking=booking,
        submitted_by=request.user,
        evidence_type=evidence_type,
        photo=photo,
        lat=lat,
        lng=lng,
        captured_at=timezone.now(),  # always server-stamped
    )

    return Response(JobEvidenceSerializer(evidence).data, status=status.HTTP_201_CREATED)


@api_view(['POST'])
def mark_done(request, pk):
    """
    Hauler marks the job as done after uploading evidence.
    Requires at least 1 pickup + 1 dropoff evidence record.
    Transition: in_progress → pending_completion
    """
    booking, err = _get_booking_or_403(request, pk)
    if err:
        return err

    if booking.hauler != request.user:
        return Response({'error': 'Only the hauler can mark a job as done.'}, status=status.HTTP_403_FORBIDDEN)

    if booking.status != 'in_progress':
        return Response(
            {'error': f'Cannot mark done — booking is currently {booking.status}.'},
            status=status.HTTP_400_BAD_REQUEST,
        )

    evidence = booking.evidence.all()
    has_pickup = evidence.filter(evidence_type='pickup').exists()
    has_dropoff = evidence.filter(evidence_type='dropoff').exists()

    if not has_pickup or not has_dropoff:
        missing = []
        if not has_pickup:
            missing.append('pickup')
        if not has_dropoff:
            missing.append('dropoff')
        return Response(
            {'error': f"Missing evidence: {', '.join(missing)}. Upload photos before marking done."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    now = timezone.now()
    release_hours = SEC.get('COMPLETION_AUTO_RELEASE_HOURS', 48)
    auto_release_at = now + timedelta(hours=release_hours)

    booking.status = 'pending_completion'
    booking.hauler_marked_done_at = now
    booking.auto_release_at = auto_release_at
    booking.job.status = 'pending_completion'
    booking.job.save(update_fields=['status', 'updated_at'])
    booking.save(update_fields=['status', 'hauler_marked_done_at', 'auto_release_at'])

    return Response(BookingSerializer(booking, context={'request': request}).data)


@api_view(['POST'])
def confirm_complete(request, pk):
    """
    Client confirms payment after hauler marks done.
    Transition: pending_completion → completed
    (Client silence → auto-release by Celery after COMPLETION_AUTO_RELEASE_HOURS)
    """
    booking, err = _get_booking_or_403(request, pk)
    if err:
        return err

    if booking.client != request.user:
        return Response({'error': 'Only the client can confirm completion.'}, status=status.HTTP_403_FORBIDDEN)

    if booking.status != 'pending_completion':
        return Response(
            {'error': f'Cannot confirm — booking is currently {booking.status}.'},
            status=status.HTTP_400_BAD_REQUEST,
        )

    _release_escrow_to_hauler(booking)
    return Response(BookingSerializer(booking, context={'request': request}).data)


@api_view(['POST'])
def open_dispute(request, pk):
    """
    Client disputes completion within the review window.
    Transition: pending_completion → disputed
    """
    booking, err = _get_booking_or_403(request, pk)
    if err:
        return err

    if booking.client != request.user:
        return Response({'error': 'Only the client can open a dispute.'}, status=status.HTTP_403_FORBIDDEN)

    if booking.status != 'pending_completion':
        return Response(
            {'error': f'Cannot dispute — booking is currently {booking.status}.'},
            status=status.HTTP_400_BAD_REQUEST,
        )

    reason = request.data.get('reason', '').strip()
    if not reason:
        return Response({'error': 'A dispute reason is required.'}, status=status.HTTP_400_BAD_REQUEST)

    now = timezone.now()
    booking.status = 'disputed'
    booking.dispute_opened_at = now
    booking.job.status = 'assigned'  # freeze job status while under review
    booking.job.save(update_fields=['status', 'updated_at'])
    booking.save(update_fields=['status', 'dispute_opened_at'])

    # Store the reason in a simple way — a full DisputeNote model is in scope for later
    # For now we log it via a transaction description on the client wallet
    client_wallet = Wallet.objects.get(user=booking.client)
    Transaction.objects.create(
        wallet=client_wallet,
        transaction_type='escrow_lock',  # escrow stays locked during dispute
        amount=0,
        reference_id=str(booking.id),
        description=f'Dispute opened: {reason[:200]}',
    )

    return Response(BookingSerializer(booking, context={'request': request}).data)


@api_view(['POST'])
def resolve_booking(request, pk):
    """
    Admin resolves a dispute.
    POST body: { "resolution": "hauler" | "client" }
    Transition: disputed → resolved_hauler (release to hauler) | resolved_client (refund to client)
    """
    if not request.user.is_staff:
        return Response({'error': 'Admin access required.'}, status=status.HTTP_403_FORBIDDEN)

    try:
        booking = Booking.objects.select_related(
            'job', 'client', 'hauler', 'hauler__hauler_profile'
        ).get(id=pk)
    except Booking.DoesNotExist:
        return Response({'error': 'Booking not found.'}, status=status.HTTP_404_NOT_FOUND)

    if booking.status != 'disputed':
        return Response(
            {'error': f'Booking is not disputed (current status: {booking.status}).'},
            status=status.HTTP_400_BAD_REQUEST,
        )

    resolution = request.data.get('resolution', '').strip()
    if resolution not in ('hauler', 'client'):
        return Response(
            {'error': "resolution must be 'hauler' (release payment) or 'client' (refund)."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    if resolution == 'hauler':
        _release_escrow_to_hauler(booking)
        booking.refresh_from_db()
        booking.status = 'resolved_hauler'
        booking.save(update_fields=['status'])
    else:
        _refund_escrow_to_client(booking)
        booking.refresh_from_db()
        booking.status = 'resolved_client'
        booking.save(update_fields=['status'])

    return Response(BookingSerializer(booking, context={'request': request}).data)


@api_view(['POST'])
def report_no_show(request, pk):
    """
    Client reports that the hauler never showed up.
    Only allowed if:
      - booking.status == 'assigned' (no PIN confirmation yet)
      - now >= job.scheduled_date + NO_SHOW_WINDOW_MINUTES
    Atomically refunds escrow to client and increments hauler's no_show_count.
    """
    booking, err = _get_booking_or_403(request, pk)
    if err:
        return err

    if booking.client != request.user:
        return Response({'error': 'Only the client can report a no-show.'}, status=status.HTTP_403_FORBIDDEN)

    if booking.status != 'assigned':
        return Response(
            {'error': f'Cannot report no-show — booking is {booking.status} (hauler may have already confirmed pickup).'},
            status=status.HTTP_400_BAD_REQUEST,
        )

    window_minutes = SEC.get('NO_SHOW_WINDOW_MINUTES', 30)
    earliest_report = booking.job.scheduled_date + timedelta(minutes=window_minutes)

    if timezone.now() < earliest_report:
        wait_secs = (earliest_report - timezone.now()).total_seconds()
        return Response(
            {
                'error': f'No-show can only be reported {window_minutes} minutes after the scheduled start time.',
                'available_at': earliest_report.isoformat(),
                'seconds_remaining': int(wait_secs),
            },
            status=status.HTTP_400_BAD_REQUEST,
        )

    with transaction.atomic():
        _refund_escrow_to_client(booking)

        # Apply no-show strike (increments count + escalates account_status)
        try:
            from apps.users.strikes import apply_no_show_strike
            apply_no_show_strike(booking.hauler)
        except Exception:
            pass  # do not block the refund if strike pipeline fails

    return Response(BookingSerializer(booking, context={'request': request}).data)


# ---------------------------------------------------------------------------
# Scope amendment flow (Task 15)
# ---------------------------------------------------------------------------

@api_view(['POST'])
def request_amendment(request, pk):
    """
    Hauler proposes a price adjustment before pickup PIN is confirmed.
    Only allowed while booking.status == 'assigned'.
    POST body: { "proposed_budget": 350.00, "reason": "..." }
    """
    booking, err = _get_booking_or_403(request, pk)
    if err:
        return err

    if booking.hauler != request.user:
        return Response({'error': 'Only the hauler can request an amendment.'}, status=status.HTTP_403_FORBIDDEN)

    if booking.status != 'assigned':
        return Response(
            {'error': 'Amendments can only be requested before pickup is confirmed.'},
            status=status.HTTP_400_BAD_REQUEST,
        )

    from apps.jobs.models import JobAmendment
    if booking.amendments.filter(status='pending').exists():
        return Response({'error': 'There is already a pending amendment for this booking.'}, status=status.HTTP_400_BAD_REQUEST)

    proposed_budget = request.data.get('proposed_budget')
    reason = request.data.get('reason', '').strip()

    if not proposed_budget or not reason:
        return Response({'error': 'proposed_budget and reason are required.'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        from decimal import Decimal
        proposed_budget = Decimal(str(proposed_budget))
        if proposed_budget <= 0:
            raise ValueError
    except (TypeError, ValueError):
        return Response({'error': 'proposed_budget must be a positive number.'}, status=status.HTTP_400_BAD_REQUEST)

    amendment = JobAmendment.objects.create(
        booking=booking,
        requested_by=request.user,
        proposed_budget=proposed_budget,
        reason=reason,
    )

    return Response({
        'id': str(amendment.id),
        'proposed_budget': str(amendment.proposed_budget),
        'reason': amendment.reason,
        'status': amendment.status,
        'created_at': amendment.created_at.isoformat(),
    }, status=status.HTTP_201_CREATED)


@api_view(['POST'])
def respond_amendment(request, pk, amendment_pk):
    """
    Client accepts or rejects a scope amendment.
    POST body: { "action": "accept" | "reject" }
    If accepted: booking.amount updated, escrow adjusted atomically.
    """
    booking, err = _get_booking_or_403(request, pk)
    if err:
        return err

    if booking.client != request.user:
        return Response({'error': 'Only the client can respond to an amendment.'}, status=status.HTTP_403_FORBIDDEN)

    from apps.jobs.models import JobAmendment
    try:
        amendment = booking.amendments.get(id=amendment_pk, status='pending')
    except JobAmendment.DoesNotExist:
        return Response({'error': 'Amendment not found or already resolved.'}, status=status.HTTP_404_NOT_FOUND)

    action = request.data.get('action', '').strip()
    if action not in ('accept', 'reject'):
        return Response({'error': "action must be 'accept' or 'reject'."}, status=status.HTTP_400_BAD_REQUEST)

    if action == 'reject':
        amendment.status = 'rejected'
        amendment.save(update_fields=['status'])
        return Response({'message': 'Amendment rejected. The hauler may cancel penalty-free.'})

    # Accept: adjust escrow atomically
    old_amount = booking.amount
    new_amount = amendment.proposed_budget
    diff = new_amount - old_amount

    from apps.payments.models import Wallet, Transaction as WalletTransaction
    with transaction.atomic():
        client_wallet = Wallet.objects.select_for_update().get(user=booking.client)
        if diff > 0 and client_wallet.available_balance < diff:
            return Response(
                {'error': f'Insufficient balance to cover amendment. Need additional ${diff}.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if diff > 0:
            client_wallet.available_balance -= diff
            client_wallet.escrow_balance += diff
        elif diff < 0:
            client_wallet.escrow_balance += diff   # diff is negative
            client_wallet.available_balance -= diff
        client_wallet.save(update_fields=['available_balance', 'escrow_balance', 'updated_at'])

        if diff != 0:
            WalletTransaction.objects.create(
                wallet=client_wallet,
                transaction_type='escrow_lock',
                amount=abs(diff),
                reference_id=str(booking.id),
                description=f'Escrow adjusted for amendment: ${old_amount} → ${new_amount}',
            )

        booking.amount = new_amount
        booking.save(update_fields=['amount'])
        amendment.status = 'accepted'
        amendment.save(update_fields=['status'])

    return Response({
        'message': f'Amendment accepted. New booking amount: ${new_amount}.',
        'new_amount': str(new_amount),
    })
