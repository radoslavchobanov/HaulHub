from __future__ import absolute_import, unicode_literals
import os
from celery import Celery
from celery.schedules import crontab

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.dev')

app = Celery('haulhub')
app.config_from_object('django.conf:settings', namespace='CELERY')
app.autodiscover_tasks()

app.conf.beat_schedule = {
    'auto-release-escrow-every-30-min': {
        'task': 'apps.bookings.tasks.auto_release_escrow',
        'schedule': crontab(minute='*/30'),
    },
}
