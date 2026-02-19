"""
Strike pipeline for trust & safety enforcement.

All thresholds are multiplied by SECURITY['STRIKE_THRESHOLD_MULTIPLIER'] from
settings. In dev this is 100 (effectively disabling automatic suspensions).
In prod it is 1 (full enforcement).

Call apply_no_show_strike(user) or apply_cancellation_strike(user) from any view
or Celery task that detects the relevant violation.
"""

from datetime import timedelta

from django.conf import settings
from django.core.cache import cache
from django.utils import timezone

SEC = settings.SECURITY


def _multiplier():
    return SEC.get('STRIKE_THRESHOLD_MULTIPLIER', 1)


def _send_strike_email(user, subject, body):
    """Stub: send account warning / suspension email."""
    # In prod wire up Django's send_mail or your email provider here.
    pass


def apply_no_show_strike(hauler_user):
    """
    Apply a no-show strike to a hauler. Increments no_show_count on HaulerProfile
    and escalates account_status according to the threshold table.

    Thresholds (multiplied by STRIKE_THRESHOLD_MULTIPLIER in dev):
      1st:  warning email, account_status = 'warned'
      2nd:  48hr suspension (is_active stays True, account_status = 'suspended')
      3rd:  14-day suspension, manual review required
      5th:  permanent ban
    """
    m = _multiplier()

    try:
        profile = hauler_user.hauler_profile
        profile.no_show_count += 1
        profile.save(update_fields=['no_show_count', 'updated_at'])
        count = profile.no_show_count
    except Exception:
        return

    if count >= 5 * m:
        hauler_user.account_status = 'banned'
        hauler_user.is_active = False
        hauler_user.save(update_fields=['account_status', 'is_active'])
        _send_strike_email(hauler_user, 'Account banned', 'Your account has been permanently banned due to repeated no-shows.')

    elif count >= 3 * m:
        hauler_user.account_status = 'suspended'
        hauler_user.save(update_fields=['account_status'])
        # Store suspension expiry in cache (14 days); a Celery task can lift it
        cache.set(f'suspension_until:{hauler_user.id}', (timezone.now() + timedelta(days=14)).isoformat(), timeout=14 * 86400)
        _send_strike_email(hauler_user, 'Account suspended', '14-day suspension. Manual review required to re-activate.')

    elif count >= 2 * m:
        hauler_user.account_status = 'suspended'
        hauler_user.save(update_fields=['account_status'])
        cache.set(f'suspension_until:{hauler_user.id}', (timezone.now() + timedelta(hours=48)).isoformat(), timeout=48 * 3600)
        _send_strike_email(hauler_user, 'Account suspended (48hr)', '48-hour booking suspension due to a no-show.')

    elif count >= 1 * m:
        hauler_user.account_status = 'warned'
        hauler_user.save(update_fields=['account_status'])
        _send_strike_email(hauler_user, 'No-show warning', 'You have received a no-show warning.')


def apply_cancellation_strike(client_user):
    """
    Apply a cancellation strike to a client. Tracks cancellation_count and
    enforces posting restrictions when thresholds are exceeded.

    Thresholds (multiplied by STRIKE_THRESHOLD_MULTIPLIER in dev):
      3 in 30 days:   warning
      5 in 30 days:   job posting suspended for 7 days
      10 total:       manual review required
    """
    m = _multiplier()

    client_user.cancellation_count += 1
    client_user.save(update_fields=['cancellation_count'])

    total = client_user.cancellation_count

    # Count cancellations in the last 30 days using bookings history
    from apps.bookings.models import Booking
    thirty_days_ago = timezone.now() - timedelta(days=30)
    recent = Booking.objects.filter(
        client=client_user,
        status='cancelled',
        completed_at__gte=thirty_days_ago,
    ).count()

    if total >= 10 * m:
        client_user.account_status = 'warned'
        client_user.save(update_fields=['account_status'])
        _send_strike_email(client_user, 'Manual review required', 'Your account requires manual review due to excessive cancellations.')

    elif recent >= 5 * m:
        client_user.account_status = 'suspended'
        client_user.save(update_fields=['account_status'])
        cache.set(f'posting_suspended_until:{client_user.id}', (timezone.now() + timedelta(days=7)).isoformat(), timeout=7 * 86400)
        _send_strike_email(client_user, 'Job posting suspended', 'Job posting suspended for 7 days due to excessive cancellations.')

    elif recent >= 3 * m:
        client_user.account_status = 'warned'
        client_user.save(update_fields=['account_status'])
        _send_strike_email(client_user, 'Cancellation warning', 'You have received a cancellation warning.')
