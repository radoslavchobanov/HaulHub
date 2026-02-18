from django.db.models import Avg
from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.response import Response

from .models import Review
from .serializers import ReviewSerializer
from apps.bookings.models import Booking


@api_view(['POST'])
def create_review(request):
    booking_id = request.data.get('booking_id')

    try:
        booking = Booking.objects.select_related('client', 'hauler', 'job').get(
            id=booking_id, status='completed'
        )
    except Booking.DoesNotExist:
        return Response(
            {'error': 'Booking not found or not yet completed.'},
            status=status.HTTP_404_NOT_FOUND
        )

    if booking.client != request.user and booking.hauler != request.user:
        return Response({'error': 'Forbidden.'}, status=status.HTTP_403_FORBIDDEN)

    if Review.objects.filter(booking=booking, reviewer=request.user).exists():
        return Response({'error': 'You have already reviewed this booking.'}, status=status.HTTP_400_BAD_REQUEST)

    reviewee = booking.hauler if request.user == booking.client else booking.client

    serializer = ReviewSerializer(data=request.data)
    if serializer.is_valid():
        review = serializer.save(booking=booking, reviewer=request.user, reviewee=reviewee)

        # Update hauler rating if reviewee is hauler
        if reviewee.user_type == 'hauler':
            agg = Review.objects.filter(reviewee=reviewee).aggregate(avg=Avg('rating'))
            profile = reviewee.hauler_profile
            profile.rating_avg = agg['avg'] or 0
            profile.review_count = Review.objects.filter(reviewee=reviewee).count()
            profile.save(update_fields=['rating_avg', 'review_count', 'updated_at'])

        return Response(ReviewSerializer(review).data, status=status.HTTP_201_CREATED)

    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
