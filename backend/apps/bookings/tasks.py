from datetime import timedelta

from celery import shared_task
from django.conf import settings
from django.db import transaction
from django.utils import timezone

SEC = settings.SECURITY


@shared_task
def auto_release_escrow():
    """
    Release escrow to haulers for bookings in pending_completion where the client
    has not responded within COMPLETION_AUTO_RELEASE_HOURS.
    Also handles legacy 'active' bookings via auto_release_at (backward compat).
    Runs every 15 minutes via Celery Beat.
    """
    from .models import Booking
    from apps.payments.models import Wallet, Transaction

    now = timezone.now()
    released = 0

    # New flow: pending_completion bookings where auto_release_at has passed
    overdue = Booking.objects.filter(
        status='pending_completion',
        auto_release_at__lte=now,
    ).select_related('client', 'hauler', 'job')

    for booking in overdue:
        try:
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
                    description=f'Auto-released (client silent): {booking.job.title}',
                )
                Transaction.objects.create(
                    wallet=hauler_wallet,
                    transaction_type='escrow_release',
                    amount=booking.amount,
                    reference_id=str(booking.id),
                    description=f'Auto-payment received: {booking.job.title}',
                )

                booking.status = 'completed'
                booking.completed_at = now
                booking.job.status = 'completed'
                booking.job.save(update_fields=['status', 'updated_at'])
                booking.save(update_fields=['status', 'completed_at'])
                released += 1
        except Exception:
            continue

    return f'Released {released} escrow(s)'


@shared_task
def auto_cancel_no_shows():
    """
    Auto-cancel bookings still in 'assigned' status after NO_SHOW_AUTO_DETECT_HOURS
    past the scheduled start time. Refunds escrow to client and issues no-show strike.
    Runs every 15 minutes via Celery Beat.
    """
    from .models import Booking
    from apps.payments.models import Wallet, Transaction

    auto_detect_hours = SEC.get('NO_SHOW_AUTO_DETECT_HOURS', 2)
    now = timezone.now()
    cutoff = now - timedelta(hours=auto_detect_hours)

    stale = Booking.objects.filter(
        status='assigned',
        job__scheduled_date__lte=cutoff,
    ).select_related('client', 'hauler', 'hauler__hauler_profile', 'job')

    cancelled = 0
    for booking in stale:
        try:
            with transaction.atomic():
                # Refund escrow to client
                client_wallet = Wallet.objects.select_for_update().get(user=booking.client)
                client_wallet.escrow_balance -= booking.amount
                client_wallet.available_balance += booking.amount
                client_wallet.save(update_fields=['escrow_balance', 'available_balance', 'updated_at'])

                Transaction.objects.create(
                    wallet=client_wallet,
                    transaction_type='escrow_refund',
                    amount=booking.amount,
                    reference_id=str(booking.id),
                    description=f'Auto-refund (hauler no-show): {booking.job.title}',
                )

                booking.status = 'cancelled'
                booking.completed_at = now
                booking.job.status = 'cancelled'
                booking.job.save(update_fields=['status', 'updated_at'])
                booking.save(update_fields=['status', 'completed_at'])

                # Apply no-show strike
                try:
                    from apps.users.strikes import apply_no_show_strike
                    apply_no_show_strike(booking.hauler)
                except Exception:
                    pass

                cancelled += 1
        except Exception:
            continue

    return f'Auto-cancelled {cancelled} no-show booking(s)'
