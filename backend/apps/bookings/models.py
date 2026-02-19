import uuid
import random
import string
from django.db import models
from django.conf import settings


def _generate_pickup_pin():
    return ''.join(random.choices(string.digits, k=6))


class Booking(models.Model):
    # State machine:
    #   assigned → in_progress (mutual PIN) → pending_completion (hauler marks done)
    #     → completed (client confirms OR 48hr auto-release)
    #     → disputed (client raises issue) → resolved_hauler / resolved_client
    STATUS_CHOICES = [
        ('assigned', 'Assigned'),       # escrow locked, waiting for pickup PIN
        ('in_progress', 'In Progress'), # PIN confirmed, haul underway
        ('pending_completion', 'Pending Completion'),  # hauler submitted evidence
        ('completed', 'Completed'),
        ('disputed', 'Disputed'),
        ('resolved_hauler', 'Resolved — Hauler'),
        ('resolved_client', 'Resolved — Client'),
        ('cancelled', 'Cancelled'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    job = models.OneToOneField('jobs.Job', on_delete=models.CASCADE, related_name='booking')
    client = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='client_bookings'
    )
    hauler = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='hauler_bookings'
    )
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='assigned')

    # PIN shown to hauler; client enters it to confirm pickup and start the haul
    pickup_pin = models.CharField(max_length=6, default=_generate_pickup_pin)

    # Timestamps for each state transition
    escrow_locked_at = models.DateTimeField(null=True, blank=True)
    pickup_confirmed_at = models.DateTimeField(null=True, blank=True)
    hauler_marked_done_at = models.DateTimeField(null=True, blank=True)
    dispute_opened_at = models.DateTimeField(null=True, blank=True)
    auto_release_at = models.DateTimeField(null=True, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f'Booking: {self.job.title} — {self.status}'


class JobEvidence(models.Model):
    """GPS-anchored photo evidence uploaded by the hauler at pickup and dropoff."""

    EVIDENCE_TYPES = [
        ('pickup', 'Pickup'),
        ('dropoff', 'Dropoff'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    booking = models.ForeignKey(Booking, on_delete=models.CASCADE, related_name='evidence')
    submitted_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='submitted_evidence',
    )
    evidence_type = models.CharField(max_length=10, choices=EVIDENCE_TYPES)
    photo = models.ImageField(upload_to='evidence/%Y/%m/')
    # Coordinates are always server-validated; sent by the client but stamped server-side
    lat = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    lng = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    # Server-stamped — device time is never trusted
    captured_at = models.DateTimeField()

    class Meta:
        ordering = ['captured_at']

    def __str__(self):
        return f'{self.evidence_type} evidence — {self.booking}'
