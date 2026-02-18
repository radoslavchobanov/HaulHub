from django.db import transaction
from django.utils import timezone
from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.response import Response

from .models import Booking
from .serializers import BookingSerializer
from apps.payments.models import Wallet, Transaction


@api_view(['GET'])
def booking_detail(request, pk):
    try:
        booking = Booking.objects.select_related(
            'job', 'job__client', 'client', 'hauler', 'hauler__hauler_profile'
        ).get(id=pk)
    except Booking.DoesNotExist:
        return Response({'error': 'Booking not found.'}, status=status.HTTP_404_NOT_FOUND)

    if booking.client != request.user and booking.hauler != request.user:
        return Response({'error': 'Forbidden.'}, status=status.HTTP_403_FORBIDDEN)

    return Response(BookingSerializer(booking, context={'request': request}).data)


@api_view(['POST'])
def complete_booking(request, pk):
    try:
        booking = Booking.objects.select_related('job', 'client', 'hauler').get(id=pk)
    except Booking.DoesNotExist:
        return Response({'error': 'Booking not found.'}, status=status.HTTP_404_NOT_FOUND)

    if booking.client != request.user:
        return Response({'error': 'Only the client can mark a booking as complete.'}, status=status.HTTP_403_FORBIDDEN)

    if booking.status != 'active':
        return Response({'error': 'Booking is not active.'}, status=status.HTTP_400_BAD_REQUEST)

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

        now = timezone.now()
        booking.status = 'completed'
        booking.completed_at = now
        booking.job.status = 'completed'
        booking.job.save(update_fields=['status', 'updated_at'])
        booking.save(update_fields=['status', 'completed_at'])

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
