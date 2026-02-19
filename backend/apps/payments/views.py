from datetime import timedelta
from decimal import Decimal

from django.conf import settings
from django.db import transaction
from django.utils import timezone
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes, throttle_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from config.throttles import DepositThrottle
from .models import Wallet, Transaction
from .serializers import WalletSerializer, TransactionSerializer

SEC = settings.SECURITY


@api_view(['GET'])
def wallet(request):
    w, _ = Wallet.objects.get_or_create(user=request.user)
    return Response(WalletSerializer(w).data)


@api_view(['POST'])
@throttle_classes([DepositThrottle])
def deposit(request):
    import stripe
    stripe.api_key = settings.STRIPE_SECRET_KEY

    amount = request.data.get('amount')
    try:
        amount = Decimal(str(amount))
        if amount < Decimal('1.00'):
            raise ValueError
    except (TypeError, ValueError, Exception):
        return Response({'error': 'Minimum deposit is $1.00.'}, status=status.HTTP_400_BAD_REQUEST)

    # Task 18: Deposit velocity limits (production only)
    if SEC.get('DEPOSIT_VELOCITY_ENABLED'):
        from django.core.cache import cache

        tier = getattr(request.user, 'verification_tier', 'unverified')
        DAILY_LIMITS = {
            'unverified':     Decimal('200.00'),
            'phone_verified': Decimal('2000.00'),
            'id_verified':    Decimal('10000.00'),
        }
        BALANCE_CAPS = {
            'unverified':     Decimal('500.00'),
            'phone_verified': Decimal('10000.00'),
            'id_verified':    None,  # no cap
        }

        daily_limit = DAILY_LIMITS.get(tier, Decimal('200.00'))
        balance_cap = BALANCE_CAPS.get(tier)

        daily_key = f'deposits:{request.user.id}:daily'
        today_total = Decimal(str(cache.get(daily_key) or '0'))

        if today_total + amount > daily_limit:
            return Response(
                {
                    'error': f'Daily deposit limit of ${daily_limit} reached for your verification level ({tier}).',
                    'upgrade_tip': 'Verify your phone or identity to increase limits.',
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        if balance_cap is not None:
            w_check, _ = Wallet.objects.get_or_create(user=request.user)
            if w_check.available_balance + w_check.escrow_balance + amount > balance_cap:
                return Response(
                    {'error': f'Wallet balance cap of ${balance_cap} reached for your verification level ({tier}).'},
                    status=status.HTTP_400_BAD_REQUEST,
                )

        # Update counter (24hr TTL)
        cache.set(daily_key, str(today_total + amount), timeout=86400)

    # Build Stripe session params
    session_params = {
        'payment_method_types': ['card'],
        'line_items': [{
            'price_data': {
                'currency': 'usd',
                'product_data': {'name': 'HaulHub Wallet Deposit'},
                'unit_amount': int(amount * 100),
            },
            'quantity': 1,
        }],
        'mode': 'payment',
        'success_url': f'{settings.FRONTEND_URL}/wallet?deposit=success',
        'cancel_url': f'{settings.FRONTEND_URL}/wallet?deposit=cancelled',
        'metadata': {
            'user_id': str(request.user.id),
            'amount': str(amount),
        },
    }

    # Task 10: Request 3D Secure in production to shift chargeback liability to card issuer
    if SEC.get('STRIPE_REQUEST_3DS'):
        session_params['payment_method_options'] = {
            'card': {'request_three_d_secure': 'any'}
        }

    session = stripe.checkout.Session.create(**session_params)
    return Response({'checkout_url': session.url})


@api_view(['POST'])
@permission_classes([AllowAny])
def stripe_webhook(request):
    import stripe
    stripe.api_key = settings.STRIPE_SECRET_KEY

    payload = request.body
    sig_header = request.META.get('HTTP_STRIPE_SIGNATURE', '')

    try:
        event = stripe.Webhook.construct_event(payload, sig_header, settings.STRIPE_WEBHOOK_SECRET)
    except (stripe.error.SignatureVerificationError, Exception):
        return Response({'error': 'Invalid signature.'}, status=status.HTTP_400_BAD_REQUEST)

    if event['type'] == 'checkout.session.completed':
        session = event['data']['object']
        user_id = session['metadata'].get('user_id')
        amount = Decimal(session['metadata'].get('amount', '0'))
        payment_intent = session.get('payment_intent', '')

        hold_days = SEC.get('DEPOSIT_HOLD_DAYS', 0)
        reserve_pct = Decimal(str(SEC.get('CHARGEBACK_RESERVE_PCT', 0.0)))

        # New accounts (<7 days) get a longer hold in production
        from django.contrib.auth import get_user_model
        User = get_user_model()
        try:
            user = User.objects.get(id=user_id)
            if hold_days > 0 and (timezone.now() - user.created_at).days < 7:
                hold_days = max(hold_days, 5)
        except User.DoesNotExist:
            pass

        with transaction.atomic():
            w = Wallet.objects.select_for_update().get(user_id=user_id)

            if hold_days == 0 and reserve_pct == 0:
                # Dev / no-hold path: credit immediately
                w.available_balance += amount
                w.save(update_fields=['available_balance', 'updated_at'])
                Transaction.objects.create(
                    wallet=w,
                    transaction_type='deposit',
                    amount=amount,
                    reference_id=payment_intent,
                    description='Wallet deposit via Stripe',
                    is_processed=True,
                )
            else:
                # Prod path: mark deposit as pending, Celery task will credit when ready
                available_at = timezone.now() + timedelta(days=hold_days)
                Transaction.objects.create(
                    wallet=w,
                    transaction_type='deposit',
                    amount=amount,
                    reference_id=payment_intent,
                    description='Wallet deposit via Stripe (pending hold)',
                    available_at=available_at,
                    is_processed=False,
                )

    return Response({'status': 'ok'})


@api_view(['POST'])
def withdraw(request):
    """
    Request a withdrawal of available_balance funds.
    In prod: KYC (id_verified) required before first payout.
    """
    amount = request.data.get('amount')
    try:
        amount = Decimal(str(amount))
        if amount < Decimal('1.00'):
            raise ValueError
    except (TypeError, ValueError, Exception):
        return Response({'error': 'Minimum withdrawal is $1.00.'}, status=status.HTTP_400_BAD_REQUEST)

    if SEC.get('REQUIRE_KYC_FOR_PAYOUT') and request.user.verification_tier != 'id_verified':
        return Response(
            {'error': 'Identity verification required before withdrawing funds.', 'kyc_required': True},
            status=status.HTTP_403_FORBIDDEN,
        )

    with transaction.atomic():
        w = Wallet.objects.select_for_update().get(user=request.user)
        if w.available_balance < amount:
            return Response(
                {'error': f'Insufficient balance. Available: ${w.available_balance}.'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        w.available_balance -= amount
        w.save(update_fields=['available_balance', 'updated_at'])
        txn = Transaction.objects.create(
            wallet=w,
            transaction_type='withdrawal',
            amount=amount,
            description='Withdrawal request',
        )

    return Response({
        'message': f'Withdrawal of ${amount} requested successfully.',
        'transaction_id': str(txn.id),
        'new_balance': str(w.available_balance),
    })
