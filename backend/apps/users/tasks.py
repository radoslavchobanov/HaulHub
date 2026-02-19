"""
Trust & safety Celery tasks for the users app.
"""

from celery import shared_task
from django.conf import settings

SEC = settings.SECURITY


@shared_task
def detect_cross_account_devices():
    """
    Scan completed bookings to find cases where the same device fingerprint
    appears on both the client and hauler sides. Flags:
      - The booking as suspicious (is_suspicious = True on Booking) [future]
      - Both users as is_suspicious (flag for manual admin review)

    Only runs when DEVICE_FINGERPRINT_ENABLED = True (prod).
    Runs weekly via Celery Beat.
    """
    if not SEC.get('DEVICE_FINGERPRINT_ENABLED'):
        return 'Device fingerprinting disabled — skipped.'

    from .models import DeviceSession, User
    from apps.bookings.models import Booking

    flagged_bookings = 0

    # Find bookings completed in the last 90 days
    from django.utils import timezone
    from datetime import timedelta
    cutoff = timezone.now() - timedelta(days=90)

    recent_bookings = Booking.objects.filter(
        status__in=('completed', 'resolved_hauler', 'resolved_client'),
        completed_at__gte=cutoff,
    ).select_related('client', 'hauler')

    for booking in recent_bookings:
        client_prints = set(
            DeviceSession.objects.filter(user=booking.client).values_list('fingerprint', flat=True)
        )
        hauler_prints = set(
            DeviceSession.objects.filter(user=booking.hauler).values_list('fingerprint', flat=True)
        )

        overlap = client_prints & hauler_prints
        if overlap:
            # Flag both users for admin review
            User.objects.filter(id__in=[booking.client_id, booking.hauler_id]).update(is_suspicious=True)
            flagged_bookings += 1

    return f'Flagged {flagged_bookings} suspicious booking(s) from device overlap.'
