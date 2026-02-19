from django.urls import path
from . import views

urlpatterns = [
    path('register/', views.register, name='register'),
    path('login/', views.login, name='login'),
    path('google/', views.google_auth, name='google-auth'),
    path('refresh/', views.refresh_token, name='token-refresh'),
    path('me/', views.me, name='me'),
    path('profile/', views.update_profile, name='update-profile'),
    # Phone verification
    path('phone/send-otp/', views.phone_send_otp, name='phone-send-otp'),
    path('phone/verify/', views.phone_verify_otp, name='phone-verify'),
    # KYC (Stripe Identity)
    path('kyc/start/', views.kyc_start, name='kyc-start'),
    path('kyc/webhook/', views.stripe_identity_webhook, name='kyc-webhook'),
]
