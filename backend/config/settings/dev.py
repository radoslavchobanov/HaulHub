from .base import *
from decouple import config, Csv

DEBUG = True

ALLOWED_HOSTS = config('ALLOWED_HOSTS', default='*', cast=Csv())

CORS_ALLOWED_ORIGINS = config(
    'CORS_ALLOWED_ORIGINS',
    default='http://localhost,http://localhost:3000,http://localhost:5173',
    cast=Csv(),
)
CORS_ALLOW_CREDENTIALS = True

CSRF_TRUSTED_ORIGINS = config(
    'CSRF_TRUSTED_ORIGINS',
    default='http://localhost,http://localhost:3000',
    cast=Csv(),
)

# Cloudflare proxy headers
SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')
USE_X_FORWARDED_HOST = True
USE_X_FORWARDED_PORT = True
