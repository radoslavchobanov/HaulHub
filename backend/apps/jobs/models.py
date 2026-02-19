import uuid
from django.db import models
from django.conf import settings


class Job(models.Model):
    CATEGORY_CHOICES = [
        ('furniture_moving', 'Furniture Moving'),
        ('junk_removal', 'Junk Removal'),
        ('appliance', 'Appliance Install/Removal'),
        ('assembly', 'Assembly (IKEA etc.)'),
        ('heavy_lifting', 'Heavy Lifting / Loading'),
        ('packing', 'Packing / Unpacking'),
        ('storage', 'Storage Help'),
        ('other', 'Other'),
    ]
    STATUS_CHOICES = [
        ('open', 'Open'),
        ('assigned', 'Assigned'),
        ('in_progress', 'In Progress'),
        ('pending_completion', 'Pending Completion'),
        ('completed', 'Completed'),
        ('cancelled', 'Cancelled'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    client = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='posted_jobs'
    )
    title = models.CharField(max_length=200)
    description = models.TextField()
    category = models.CharField(max_length=30, choices=CATEGORY_CHOICES)
    budget = models.DecimalField(max_digits=10, decimal_places=2)
    country = models.CharField(max_length=2)
    city = models.CharField(max_length=100)
    neighborhood = models.CharField(max_length=100, blank=True)
    scheduled_date = models.DateTimeField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='open')

    # Structured scope fields (task 15) — form the contractual record of what was agreed
    item_count = models.IntegerField(null=True, blank=True)
    estimated_weight_kg = models.DecimalField(max_digits=6, decimal_places=1, null=True, blank=True)
    num_rooms = models.IntegerField(null=True, blank=True)
    floor_number = models.IntegerField(null=True, blank=True)
    has_elevator = models.BooleanField(null=True, blank=True)
    special_items = models.JSONField(default=list, blank=True)  # e.g. ["piano", "safe"]
    photo_urls = models.JSONField(default=list, blank=True)     # pre-job item condition photos

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    @property
    def location_display(self):
        parts = [p for p in [self.neighborhood, self.city, self.country] if p]
        return ', '.join(parts)

    def __str__(self):
        return f'{self.title} (${self.budget})'


class JobAmendment(models.Model):
    """
    Scope amendment requested by the hauler before pickup PIN is confirmed.
    Allows the hauler to propose a price adjustment when job scope differs
    from what was posted. If the client rejects and the hauler cancels,
    no strike is applied.
    """
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('accepted', 'Accepted'),
        ('rejected', 'Rejected'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    booking = models.ForeignKey(
        'bookings.Booking',
        on_delete=models.CASCADE,
        related_name='amendments',
    )
    requested_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='requested_amendments',
    )
    proposed_budget = models.DecimalField(max_digits=10, decimal_places=2)
    reason = models.TextField()
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='pending')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f'Amendment for {self.booking} — ${self.proposed_budget} ({self.status})'


class JobApplication(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('negotiating', 'Negotiating'),
        ('accepted', 'Accepted'),
        ('rejected', 'Rejected'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    job = models.ForeignKey(Job, on_delete=models.CASCADE, related_name='applications')
    hauler = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='applications'
    )
    proposal_message = models.TextField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('job', 'hauler')
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.hauler.full_name} → {self.job.title}'
