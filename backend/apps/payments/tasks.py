from datetime import timedelta
from decimal import Decimal

from celery import shared_task
from django.conf import settings
from django.db import transaction
from django.utils import timezone

SEC = settings.SECURITY


@shared_task
def process_matured_deposits():
    """
    Credit pending deposits to wallets once their hold period has elapsed.
    For each matured deposit:
      - (1 - CHARGEBACK_RESERVE_PCT) goes to available_balance
      - CHARGEBACK_RESERVE_PCT goes to reserve_balance + a reserve_hold transaction
    Runs nightly via Celery Beat.
    """
    from .models import Wallet, Transaction

    now = timezone.now()
    reserve_pct = Decimal(str(SEC.get('CHARGEBACK_RESERVE_PCT', 0.0)))
    reserve_release_days = SEC.get('RESERVE_RELEASE_DAYS', 30)

    pending = Transaction.objects.filter(
        transaction_type='deposit',
        is_processed=False,
        available_at__lte=now,
    ).select_related('wallet')

    processed = 0
    for txn in pending:
        try:
            with transaction.atomic():
                w = Wallet.objects.select_for_update().get(pk=txn.wallet_id)
                spendable = txn.amount * (1 - reserve_pct)
                reserve = txn.amount * reserve_pct

                w.available_balance += spendable
                if reserve > 0:
                    w.reserve_balance += reserve
                w.save(update_fields=['available_balance', 'reserve_balance', 'updated_at'])

                # Mark original deposit processed
                txn.is_processed = True
                txn.save(update_fields=['is_processed'])

                # Create a reserve_hold transaction that matures later
                if reserve > 0:
                    Transaction.objects.create(
                        wallet=w,
                        transaction_type='reserve_hold',
                        amount=reserve,
                        reference_id=txn.reference_id,
                        description=f'Chargeback reserve for deposit {txn.id}',
                        available_at=now + timedelta(days=reserve_release_days),
                        is_processed=False,
                    )
                processed += 1
        except Exception:
            continue

    return f'Processed {processed} matured deposit(s)'


@shared_task
def release_matured_reserves():
    """
    Move matured reserve_balance funds to available_balance.
    Runs nightly via Celery Beat.
    """
    from .models import Wallet, Transaction

    now = timezone.now()
    pending = Transaction.objects.filter(
        transaction_type='reserve_hold',
        is_processed=False,
        available_at__lte=now,
    ).select_related('wallet')

    released = 0
    for txn in pending:
        try:
            with transaction.atomic():
                w = Wallet.objects.select_for_update().get(pk=txn.wallet_id)
                w.reserve_balance -= txn.amount
                w.available_balance += txn.amount
                w.save(update_fields=['reserve_balance', 'available_balance', 'updated_at'])

                txn.is_processed = True
                txn.save(update_fields=['is_processed'])

                Transaction.objects.create(
                    wallet=w,
                    transaction_type='reserve_release',
                    amount=txn.amount,
                    reference_id=txn.reference_id,
                    description='Chargeback reserve released',
                )
                released += 1
        except Exception:
            continue

    return f'Released {released} reserve(s)'
