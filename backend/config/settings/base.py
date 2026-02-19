from pathlib import Path
from datetime import timedelta
from decouple import config, Csv

BASE_DIR = Path(__file__).resolve().parent.parent.parent

SECRET_KEY = config('SECRET_KEY')

INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    # Third party
    'rest_framework',
    'rest_framework_simplejwt',
    'corsheaders',
    'channels',
    'django_celery_beat',
    # Local
    'apps.users',
    'apps.jobs',
    'apps.bookings',
    'apps.payments',
    'apps.chat',
    'apps.reviews',
]

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'corsheaders.middleware.CorsMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'config.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'config.wsgi.application'
ASGI_APPLICATION = 'config.asgi.application'

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': config('POSTGRES_DB'),
        'USER': config('POSTGRES_USER'),
        'PASSWORD': config('POSTGRES_PASSWORD'),
        'HOST': config('POSTGRES_HOST', default='postgres'),
        'PORT': config('POSTGRES_PORT', default='5432'),
    }
}

AUTH_USER_MODEL = 'users.User'

AUTHENTICATION_BACKENDS = [
    'django.contrib.auth.backends.ModelBackend',
]

AUTH_PASSWORD_VALIDATORS = [
    {'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator'},
    {'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator'},
    {'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator'},
    {'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator'},
]

LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'UTC'
USE_I18N = True
USE_TZ = True

STATIC_URL = '/static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'

MEDIA_URL = '/media/'
MEDIA_ROOT = BASE_DIR / 'media'

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# Django REST Framework
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ],
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.IsAuthenticated',
    ],
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 20,
    # Per-scope throttle rates (enforced only when SECURITY['RATE_LIMITING_ENABLED'] = True)
    'DEFAULT_THROTTLE_RATES': {
        'job_creation':     '10/hour',
        'job_application':  '20/hour',
        'escrow_lock':      '5/hour',
        'deposit':          '5/hour',
        'review':           '5/day',
        'evidence_upload':  '20/hour',
        'auth':             '20/hour',
    },
}

# JWT
SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(hours=1),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=7),
    'ROTATE_REFRESH_TOKENS': True,
    'BLACKLIST_AFTER_ROTATION': False,
    'AUTH_HEADER_TYPES': ('Bearer',),
}

# Django Channels
CHANNEL_LAYERS = {
    'default': {
        'BACKEND': 'channels_redis.core.RedisChannelLayer',
        'CONFIG': {
            'hosts': [config('REDIS_URL', default='redis://redis:6379/0')],
        },
    },
}

# Celery
CELERY_BROKER_URL = config('REDIS_URL', default='redis://redis:6379/0')
CELERY_RESULT_BACKEND = config('REDIS_URL', default='redis://redis:6379/0')
CELERY_ACCEPT_CONTENT = ['json']
CELERY_TASK_SERIALIZER = 'json'
CELERY_RESULT_SERIALIZER = 'json'
CELERY_TIMEZONE = 'UTC'

# Stripe
STRIPE_SECRET_KEY = config('STRIPE_SECRET_KEY', default='')
STRIPE_WEBHOOK_SECRET = config('STRIPE_WEBHOOK_SECRET', default='')

# Google OAuth
GOOGLE_CLIENT_ID = config('GOOGLE_CLIENT_ID', default='')
GOOGLE_CLIENT_SECRET = config('GOOGLE_CLIENT_SECRET', default='')

# Frontend URL for Stripe redirects
FRONTEND_URL = config('FRONTEND_URL', default='http://localhost')

# ---------------------------------------------------------------------------
# Security Features
# ---------------------------------------------------------------------------
# All flags default to dev-friendly (relaxed) values here.
# prod.py overrides these with strict production values.
# Code throughout the app reads from django.conf.settings.SECURITY instead
# of hardcoding behaviour, so the same code path runs in both environments.
# ---------------------------------------------------------------------------
SECURITY = {
    # --- Completion auto-release ---
    # Hours after hauler marks done before escrow auto-releases (client silence).
    # Dev: 15 minutes (0.25 hr). Prod: 48 hours.
    'COMPLETION_AUTO_RELEASE_HOURS': 0.25,

    # --- No-show detection ---
    # Minutes after scheduled_start before client can press "Report No-Show".
    # Dev: 5 min. Prod: 30 min.
    'NO_SHOW_WINDOW_MINUTES': 5,
    # Hours after scheduled_start before Celery auto-cancels (belt-and-suspenders).
    # Dev: 0.5 hr. Prod: 2 hr.
    'NO_SHOW_AUTO_DETECT_HOURS': 0.5,

    # --- Chargeback reserve ---
    # Fraction of each deposit held as reserve (0.0 = disabled).
    # Dev: 0%. Prod: 10%.
    'CHARGEBACK_RESERVE_PCT': 0.0,
    # Days before a deposit becomes spendable (0 = immediate).
    # Dev: 0. Prod: 3 (new accounts: 5).
    'DEPOSIT_HOLD_DAYS': 0,
    # Days before chargeback reserve is released back to available_balance.
    # Dev: 0. Prod: 30.
    'RESERVE_RELEASE_DAYS': 0,

    # --- Identity / verification ---
    # Whether phone verification is required before posting/applying to jobs.
    'REQUIRE_PHONE_VERIFICATION': False,
    # Whether Stripe Identity KYC is required before first payout.
    'REQUIRE_KYC_FOR_PAYOUT': False,

    # --- Geo-validation ---
    # Whether GPS coordinates on evidence photos are validated against job address.
    'GEO_VALIDATION_ENABLED': False,
    # Acceptable radius in metres between evidence GPS and job address.
    # Dev: unused (validation off). Prod: 500 m.
    'GEO_VALIDATION_RADIUS_METERS': 500,

    # --- Rate limiting ---
    # Master switch. False = no throttling applied (speeds up local testing).
    'RATE_LIMITING_ENABLED': False,

    # --- Deposit velocity ---
    # Whether per-tier daily deposit caps are enforced.
    'DEPOSIT_VELOCITY_ENABLED': False,

    # --- Device fingerprinting ---
    # Whether device fingerprint cross-account detection task runs.
    'DEVICE_FINGERPRINT_ENABLED': False,

    # --- IP reputation ---
    # Whether registrations from datacenter/VPN IPs trigger extra verification.
    'IP_REPUTATION_CHECK_ENABLED': False,

    # --- Review cooling ---
    # Minutes after completion before a review can be submitted.
    # Dev: 1 min. Prod: 60 min.
    'REVIEW_COOLING_PERIOD_MINUTES': 1,

    # --- Strike thresholds ---
    # Multiplier applied to all strike thresholds in dev (effectively disables them).
    # Dev: 100. Prod: 1.
    'STRIKE_THRESHOLD_MULTIPLIER': 100,

    # --- Stripe ---
    # Whether to request 3D Secure on card payments (shifts chargeback liability).
    'STRIPE_REQUEST_3DS': False,
}
