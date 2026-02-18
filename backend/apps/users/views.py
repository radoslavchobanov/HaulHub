from rest_framework import status
from rest_framework.decorators import api_view, permission_classes, parser_classes
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests
from django.conf import settings

from .models import User, HaulerProfile
from .serializers import UserSerializer, HaulerProfileSerializer, RegisterSerializer, LoginSerializer


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
def login(request):
    serializer = LoginSerializer(data=request.data)
    if serializer.is_valid():
        user = serializer.validated_data['user']
        return Response({
            'user': UserSerializer(user).data,
            'tokens': get_tokens(user),
        })
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([AllowAny])
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


@api_view(['GET'])
def me(request):
    return Response(UserSerializer(request.user).data)


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
