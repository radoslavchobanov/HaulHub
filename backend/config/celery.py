from __future__ import absolute_import, unicode_literals
import os
from celery import Celery
from celery.schedules import crontab

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.dev')

app = Celery('haulhub')
app.config_from_object('django.conf:settings', namespace='CELERY')
app.autodiscover_tasks()

app.conf.beat_schedule = {
    'auto-release-escrow-every-15-min': {
        'task': 'apps.bookings.tasks.auto_release_escrow',
        'schedule': crontab(minute='*/15'),
    },
    'auto-cancel-no-shows-every-15-min': {
        'task': 'apps.bookings.tasks.auto_cancel_no_shows',
        'schedule': crontab(minute='*/15'),
    },
    'process-matured-deposits-nightly': {
        'task': 'apps.payments.tasks.process_matured_deposits',
        'schedule': crontab(hour=2, minute=0),  # 2am UTC daily
    },
    'release-matured-reserves-nightly': {
        'task': 'apps.payments.tasks.release_matured_reserves',
        'schedule': crontab(hour=2, minute=30),  # 2:30am UTC daily
    },
    'detect-cross-account-devices-weekly': {
        'task': 'apps.users.tasks.detect_cross_account_devices',
        'schedule': crontab(hour=3, minute=0, day_of_week=1),  # Monday 3am UTC
    },
}
