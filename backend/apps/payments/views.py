from decimal import Decimal
from django.conf import settings
from django.db import transaction
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response

from .models import Wallet, Transaction
from .serializers import WalletSerializer, TransactionSerializer


@api_view(['GET'])
def wallet(request):
    w, _ = Wallet.objects.get_or_create(user=request.user)
    serializer = WalletSerializer(w)
    return Response(serializer.data)


@api_view(['POST'])
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

    session = stripe.checkout.Session.create(
        payment_method_types=['card'],
        line_items=[{
            'price_data': {
                'currency': 'usd',
                'product_data': {'name': 'HaulHub Wallet Deposit'},
                'unit_amount': int(amount * 100),
            },
            'quantity': 1,
        }],
        mode='payment',
        success_url=f'{settings.FRONTEND_URL}/wallet?deposit=success',
        cancel_url=f'{settings.FRONTEND_URL}/wallet?deposit=cancelled',
        metadata={
            'user_id': str(request.user.id),
            'amount': str(amount),
        },
    )
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

        with transaction.atomic():
            w = Wallet.objects.select_for_update().get(user_id=user_id)
            w.available_balance += amount
            w.save(update_fields=['available_balance', 'updated_at'])

            Transaction.objects.create(
                wallet=w,
                transaction_type='deposit',
                amount=amount,
                reference_id=payment_intent,
                description='Wallet deposit via Stripe',
            )

    return Response({'status': 'ok'})
