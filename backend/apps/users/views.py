import random
import string

from django.conf import settings
from django.core.cache import cache
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes, parser_classes, throttle_classes
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests

from config.throttles import AuthThrottle
from .models import User, HaulerProfile
from .serializers import UserSerializer, UpdateUserSerializer, HaulerProfileSerializer, RegisterSerializer, LoginSerializer

SEC = settings.SECURITY


def get_tokens(user):
    refresh = RefreshToken.for_user(user)
    return {
        'refresh': str(refresh),
        'access': str(refresh.access_token),
    }


def _create_wallet_and_profile(user):
    from apps.payments.models import Wallet
    Wallet.objects.get_or_create(user=user)
    if user.user_type == 'hauler':
        HaulerProfile.objects.get_or_create(user=user)


@api_view(['POST'])
@permission_classes([AllowAny])
@throttle_classes([AuthThrottle])
def register(request):
    serializer = RegisterSerializer(data=request.data)
    if serializer.is_valid():
        user = serializer.save()
        _create_wallet_and_profile(user)
        return Response({
            'user': UserSerializer(user).data,
            'tokens': get_tokens(user),
        }, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([AllowAny])
@throttle_classes([AuthThrottle])
def login(request):
    serializer = LoginSerializer(data=request.data)
    if serializer.is_valid():
        user = serializer.validated_data['user']

        # Task 17: Log device fingerprint (production only)
        if SEC.get('DEVICE_FINGERPRINT_ENABLED'):
            fingerprint = request.data.get('device_fingerprint') or request.META.get('HTTP_X_DEVICE_FINGERPRINT', '')
            if fingerprint:
                ip = (
                    request.META.get('HTTP_X_FORWARDED_FOR', '').split(',')[0].strip()
                    or request.META.get('REMOTE_ADDR')
                )
                from .models import DeviceSession
                DeviceSession.objects.create(user=user, fingerprint=fingerprint[:128], ip_address=ip or None)

        return Response({
            'user': UserSerializer(user).data,
            'tokens': get_tokens(user),
        })
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([AllowAny])
@throttle_classes([AuthThrottle])
def google_auth(request):
    token = request.data.get('token')
    user_type = request.data.get('user_type')

    if not token:
        return Response({'error': 'Google token is required.'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        idinfo = id_token.verify_oauth2_token(
            token,
            google_requests.Request(),
            settings.GOOGLE_CLIENT_ID,
        )
        google_id = idinfo['sub']
        email = idinfo['email']
        first_name = idinfo.get('given_name', '')
        last_name = idinfo.get('family_name', '')
    except Exception:
        return Response({'error': 'Invalid Google token.'}, status=status.HTTP_400_BAD_REQUEST)

    # Try to find existing user
    user = User.objects.filter(google_id=google_id).first()
    if not user:
        user = User.objects.filter(email=email).first()

    if not user:
        # New user — need user_type to complete registration
        if not user_type:
            return Response({'requires_type': True, 'email': email, 'first_name': first_name, 'last_name': last_name}, status=status.HTTP_200_OK)
        user = User.objects.create_user(
            email=email,
            first_name=first_name,
            last_name=last_name,
            user_type=user_type,
            auth_provider='google',
            google_id=google_id,
        )
        _create_wallet_and_profile(user)
    else:
        if not user.google_id:
            user.google_id = google_id
            user.save(update_fields=['google_id'])

    return Response({
        'user': UserSerializer(user).data,
        'tokens': get_tokens(user),
    })


@api_view(['POST'])
@permission_classes([AllowAny])
def refresh_token(request):
    from rest_framework_simplejwt.serializers import TokenRefreshSerializer
    serializer = TokenRefreshSerializer(data=request.data)
    if serializer.is_valid():
        return Response(serializer.validated_data)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET', 'PATCH'])
def me(request):
    if request.method == 'GET':
        return Response(UserSerializer(request.user).data)
    serializer = UpdateUserSerializer(request.user, data=request.data, partial=True)
    if serializer.is_valid():
        serializer.save()
        return Response(UserSerializer(request.user).data)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['PATCH'])
@parser_classes([MultiPartParser, FormParser, JSONParser])
def update_profile(request):
    user = request.user
    if user.user_type != 'hauler':
        return Response({'error': 'Only haulers have profiles.'}, status=status.HTTP_403_FORBIDDEN)
    profile, _ = HaulerProfile.objects.get_or_create(user=user)
    serializer = HaulerProfileSerializer(profile, data=request.data, partial=True)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([AllowAny])
def hauler_detail(request, pk):
    try:
        user = User.objects.get(id=pk, user_type='hauler')
        return Response(UserSerializer(user).data)
    except User.DoesNotExist:
        return Response({'error': 'Hauler not found.'}, status=status.HTTP_404_NOT_FOUND)


@api_view(['GET'])
@permission_classes([AllowAny])
def hauler_reviews(request, pk):
    from apps.reviews.models import Review
    from apps.reviews.serializers import ReviewSerializer
    reviews = Review.objects.filter(reviewee_id=pk).select_related('reviewer').order_by('-created_at')
    return Response(ReviewSerializer(reviews, many=True).data)


# ---------------------------------------------------------------------------
# Phone verification (OTP)
# ---------------------------------------------------------------------------
# In dev (REQUIRE_PHONE_VERIFICATION=False): the send endpoint still works but
# always uses OTP "000000" — no SMS is sent. This lets devs test the full flow
# without a Twilio account.
# In prod: a real SMS would be sent via Twilio (left as a stub; integrate by
# setting TWILIO_* env vars and implementing _send_sms below).
# ---------------------------------------------------------------------------

# ---------------------------------------------------------------------------
# KYC via Stripe Identity (Task 16)
# ---------------------------------------------------------------------------
# In dev (REQUIRE_KYC_FOR_PAYOUT=False): endpoint exists but is informational only.
# In prod: creates a Stripe Identity VerificationSession; the webhook below
# promotes user.verification_tier = 'id_verified' on success.
# ---------------------------------------------------------------------------

@api_view(['POST'])
def kyc_start(request):
    """
    Create a Stripe Identity VerificationSession and return the client_secret
    to the frontend, which uses Stripe.js to present the verification modal.
    In dev: returns a dummy response (no real Stripe call).
    """
    if not SEC.get('REQUIRE_KYC_FOR_PAYOUT'):
        return Response({
            'dev_mode': True,
            'message': 'KYC is not required in dev. Set REQUIRE_KYC_FOR_PAYOUT=True in prod settings.',
            'already_tier': request.user.verification_tier,
        })

    if request.user.verification_tier == 'id_verified':
        return Response({'message': 'Identity already verified.'})

    import stripe
    stripe.api_key = settings.STRIPE_SECRET_KEY

    try:
        verification_session = stripe.identity.VerificationSession.create(
            type='document',
            metadata={'user_id': str(request.user.id)},
        )
        return Response({
            'client_secret': verification_session.client_secret,
            'verification_session_id': verification_session.id,
        })
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([AllowAny])
def stripe_identity_webhook(request):
    """
    Stripe Identity webhook handler.
    On identity.verification_session.verified: sets user.verification_tier = 'id_verified'.
    """
    import stripe
    stripe.api_key = settings.STRIPE_SECRET_KEY

    payload = request.body
    sig_header = request.META.get('HTTP_STRIPE_SIGNATURE', '')
    webhook_secret = getattr(settings, 'STRIPE_IDENTITY_WEBHOOK_SECRET', settings.STRIPE_WEBHOOK_SECRET)

    try:
        event = stripe.Webhook.construct_event(payload, sig_header, webhook_secret)
    except Exception:
        return Response({'error': 'Invalid signature.'}, status=status.HTTP_400_BAD_REQUEST)

    if event['type'] == 'identity.verification_session.verified':
        session = event['data']['object']
        user_id = session.get('metadata', {}).get('user_id')
        if user_id:
            try:
                user = User.objects.get(id=user_id)
                user.verification_tier = 'id_verified'
                user.save(update_fields=['verification_tier'])
            except User.DoesNotExist:
                pass

    return Response({'status': 'ok'})


def _send_sms(phone_number: str, otp: str):
    """Send OTP via SMS. Stub — wire up Twilio in production."""
    # In prod, implement:
    #   from twilio.rest import Client
    #   client = Client(settings.TWILIO_ACCOUNT_SID, settings.TWILIO_AUTH_TOKEN)
    #   client.messages.create(body=f'Your HaulHub code: {otp}', from_=settings.TWILIO_FROM, to=phone_number)
    pass


@api_view(['POST'])
@throttle_classes([AuthThrottle])
def phone_send_otp(request):
    """
    Send a one-time code to the user's phone number.
    POST body: { "phone": "+15551234567" }
    In dev: no SMS sent; use OTP "000000" to verify.
    """
    phone = request.data.get('phone', '').strip()
    if not phone:
        return Response({'error': 'phone is required.'}, status=status.HTTP_400_BAD_REQUEST)

    if not SEC.get('REQUIRE_PHONE_VERIFICATION'):
        # Dev shortcut: store "000000" so the verify endpoint works without SMS
        otp = '000000'
    else:
        otp = ''.join(random.choices(string.digits, k=6))
        _send_sms(phone, otp)

    # Store OTP in Redis (via Django cache) for 10 minutes
    cache_key = f'phone_otp:{request.user.id}:{phone}'
    cache.set(cache_key, otp, timeout=600)

    msg = 'OTP sent.' if SEC.get('REQUIRE_PHONE_VERIFICATION') else 'Dev mode: use OTP 000000.'
    return Response({'message': msg})


@api_view(['POST'])
@throttle_classes([AuthThrottle])
def phone_verify_otp(request):
    """
    Verify the OTP and mark phone as verified.
    POST body: { "phone": "+15551234567", "otp": "123456" }
    On success: sets phone_verified=True and bumps verification_tier to phone_verified.
    """
    phone = request.data.get('phone', '').strip()
    otp = request.data.get('otp', '').strip()

    if not phone or not otp:
        return Response({'error': 'phone and otp are required.'}, status=status.HTTP_400_BAD_REQUEST)

    cache_key = f'phone_otp:{request.user.id}:{phone}'
    stored_otp = cache.get(cache_key)

    if not stored_otp or stored_otp != otp:
        return Response({'error': 'Invalid or expired OTP.'}, status=status.HTTP_400_BAD_REQUEST)

    cache.delete(cache_key)

    user = request.user
    user.phone = phone
    user.phone_verified = True
    if user.verification_tier == 'unverified':
        user.verification_tier = 'phone_verified'
    user.save(update_fields=['phone', 'phone_verified', 'verification_tier'])

    return Response({'message': 'Phone verified successfully.', 'user': UserSerializer(user).data})
