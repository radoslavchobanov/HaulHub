from celery import shared_task
from django.db import transaction
from django.utils import timezone


@shared_task
def auto_release_escrow():
    from .models import Booking
    from apps.payments.models import Wallet, Transaction

    now = timezone.now()
    overdue = Booking.objects.filter(
        status='active',
        auto_release_at__lte=now,
    ).select_related('client', 'hauler', 'job')

    released = 0
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
                    description=f'Auto-released: {booking.job.title}',
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
