from .base import *
from decouple import config, Csv

DEBUG = False

ALLOWED_HOSTS = config('ALLOWED_HOSTS', cast=Csv())

CORS_ALLOWED_ORIGINS = config('CORS_ALLOWED_ORIGINS', cast=Csv())
CORS_ALLOW_CREDENTIALS = True

CSRF_TRUSTED_ORIGINS = config('CSRF_TRUSTED_ORIGINS', cast=Csv())

# Cloudflare proxy headers
SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')
USE_X_FORWARDED_HOST = True
USE_X_FORWARDED_PORT = True

SECURE_HSTS_SECONDS = 31536000
SECURE_HSTS_INCLUDE_SUBDOMAINS = True
SECURE_CONTENT_TYPE_NOSNIFF = True
X_FRAME_OPTIONS = 'DENY'

# ---------------------------------------------------------------------------
# Security Features — Production Overrides
# ---------------------------------------------------------------------------
# These values override the dev-friendly defaults from base.py.
# ---------------------------------------------------------------------------
SECURITY = {
    'COMPLETION_AUTO_RELEASE_HOURS': 48,
    'NO_SHOW_WINDOW_MINUTES': 30,
    'NO_SHOW_AUTO_DETECT_HOURS': 2,
    'CHARGEBACK_RESERVE_PCT': 0.10,
    'DEPOSIT_HOLD_DAYS': 3,
    'RESERVE_RELEASE_DAYS': 30,
    'REQUIRE_PHONE_VERIFICATION': True,
    'REQUIRE_KYC_FOR_PAYOUT': True,
    'GEO_VALIDATION_ENABLED': True,
    'GEO_VALIDATION_RADIUS_METERS': 500,
    'RATE_LIMITING_ENABLED': True,
    'DEPOSIT_VELOCITY_ENABLED': True,
    'DEVICE_FINGERPRINT_ENABLED': True,
    'IP_REPUTATION_CHECK_ENABLED': True,
    'REVIEW_COOLING_PERIOD_MINUTES': 60,
    'STRIKE_THRESHOLD_MULTIPLIER': 1,
    'STRIPE_REQUEST_3DS': True,
}
