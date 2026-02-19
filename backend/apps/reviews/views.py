from datetime import timedelta
from decimal import Decimal

from django.conf import settings
from django.db.models import Avg, ExpressionWrapper, FloatField, Case, When, Value
from django.utils import timezone
from rest_framework import status
from rest_framework.decorators import api_view, throttle_classes
from rest_framework.response import Response

from config.throttles import ReviewThrottle
from .models import Review
from .serializers import ReviewSerializer
from apps.bookings.models import Booking

SEC = settings.SECURITY


def _update_hauler_rating(reviewee):
    """
    Recompute HaulerProfile rating using a weighted average:
      - Reviews < 90 days old:        weight 2
      - Reviews from verified clients: weight 1.5
      - Flagged reviews:               weight 0  (excluded)
    review_count counts only unflagged reviews.
    """
    from apps.users.models import HaulerProfile

    unflagged = Review.objects.filter(reviewee=reviewee, is_flagged=False)

    if not unflagged.exists():
        profile = reviewee.hauler_profile
        profile.rating_avg = 0
        profile.review_count = 0
        profile.save(update_fields=['rating_avg', 'review_count', 'updated_at'])
        return

    now = timezone.now()
    cutoff_90 = now - timedelta(days=90)

    weighted_sum = Decimal('0')
    weight_total = Decimal('0')

    for review in unflagged.select_related('reviewer'):
        w = Decimal('1.0')
        if review.created_at >= cutoff_90:
            w *= Decimal('2.0')
        if getattr(review.reviewer, 'phone_verified', False):
            w *= Decimal('1.5')
        weighted_sum += Decimal(str(review.rating)) * w
        weight_total += w

    avg = float(weighted_sum / weight_total) if weight_total > 0 else 0

    profile = reviewee.hauler_profile
    profile.rating_avg = round(avg, 2)
    profile.review_count = unflagged.count()
    profile.save(update_fields=['rating_avg', 'review_count', 'updated_at'])


@api_view(['POST'])
@throttle_classes([ReviewThrottle])
def create_review(request):
    booking_id = request.data.get('booking_id')

    try:
        booking = Booking.objects.select_related('client', 'hauler', 'job').get(
            id=booking_id,
            status__in=('completed', 'resolved_hauler', 'resolved_client'),
        )
    except Booking.DoesNotExist:
        return Response(
            {'error': 'Booking not found or not yet completed.'},
            status=status.HTTP_404_NOT_FOUND,
        )

    if booking.client != request.user and booking.hauler != request.user:
        return Response({'error': 'Forbidden.'}, status=status.HTTP_403_FORBIDDEN)

    # Evidence gate: booking must have JobEvidence (proof work happened)
    if not booking.evidence.filter(evidence_type='pickup').exists():
        return Response(
            {'error': 'Reviews can only be submitted for jobs with pickup evidence on record.'},
            status=status.HTTP_400_BAD_REQUEST,
        )

    # Cooling period gate
    cooling = SEC.get('REVIEW_COOLING_PERIOD_MINUTES', 60)
    if booking.completed_at and timezone.now() < booking.completed_at + timedelta(minutes=cooling):
        available_at = booking.completed_at + timedelta(minutes=cooling)
        return Response(
            {
                'error': f'Review available {cooling} minutes after job completion.',
                'available_at': available_at.isoformat(),
            },
            status=status.HTTP_400_BAD_REQUEST,
        )

    # Daily velocity gate (max 5 reviews per user per day)
    from django.core.cache import cache
    velocity_key = f'review_velocity:{request.user.id}'
    today_count = int(cache.get(velocity_key) or 0)
    if today_count >= 5:
        return Response({'error': 'Daily review limit reached (5 per day).'}, status=status.HTTP_429_TOO_MANY_REQUESTS)

    if Review.objects.filter(booking=booking, reviewer=request.user).exists():
        return Response({'error': 'You have already reviewed this booking.'}, status=status.HTTP_400_BAD_REQUEST)

    reviewee = booking.hauler if request.user == booking.client else booking.client

    serializer = ReviewSerializer(data=request.data)
    if serializer.is_valid():
        review = serializer.save(booking=booking, reviewer=request.user, reviewee=reviewee)

        # Increment daily velocity counter (24hr TTL)
        cache.set(velocity_key, today_count + 1, timeout=86400)

        # Update hauler rating using weighted average
        if reviewee.user_type == 'hauler':
            _update_hauler_rating(reviewee)

        return Response(ReviewSerializer(review).data, status=status.HTTP_201_CREATED)

    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
