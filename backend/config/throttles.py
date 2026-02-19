"""
Custom DRF throttle classes for HaulHub.

All throttles inherit from ConditionalThrottle, which skips enforcement when
SECURITY['RATE_LIMITING_ENABLED'] is False (dev environment). In production,
full per-scope limits are enforced.

Usage:
    @api_view(['POST'])
    @throttle_classes([JobCreationThrottle])
    def my_view(request):
        ...
"""

from django.conf import settings
from rest_framework.throttling import UserRateThrottle, AnonRateThrottle


class ConditionalThrottle:
    """Skip throttle enforcement when RATE_LIMITING_ENABLED is False."""

    def allow_request(self, request, view):
        if not settings.SECURITY.get('RATE_LIMITING_ENABLED', False):
            return True
        return super().allow_request(request, view)

    def wait(self):
        if not settings.SECURITY.get('RATE_LIMITING_ENABLED', False):
            return None
        return super().wait()


class JobCreationThrottle(ConditionalThrottle, UserRateThrottle):
    scope = 'job_creation'


class JobApplicationThrottle(ConditionalThrottle, UserRateThrottle):
    scope = 'job_application'


class EscrowLockThrottle(ConditionalThrottle, UserRateThrottle):
    scope = 'escrow_lock'


class DepositThrottle(ConditionalThrottle, UserRateThrottle):
    scope = 'deposit'


class ReviewThrottle(ConditionalThrottle, UserRateThrottle):
    scope = 'review'


class EvidenceUploadThrottle(ConditionalThrottle, UserRateThrottle):
    scope = 'evidence_upload'


class AuthThrottle(ConditionalThrottle, AnonRateThrottle):
    """IP-based throttle for auth endpoints (login / register)."""
    scope = 'auth'
