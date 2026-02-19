import uuid
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.db import models


class UserManager(BaseUserManager):
    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError('Email is required')
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        if password:
            user.set_password(password)
        else:
            user.set_unusable_password()
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('user_type', 'client')
        return self.create_user(email, password, **extra_fields)


class User(AbstractBaseUser, PermissionsMixin):
    USER_TYPE_CHOICES = [
        ('client', 'Client'),
        ('hauler', 'Hauler'),
    ]
    AUTH_PROVIDER_CHOICES = [
        ('email', 'Email'),
        ('google', 'Google'),
    ]

    ACCOUNT_STATUS_CHOICES = [
        ('active', 'Active'),
        ('warned', 'Warned'),
        ('suspended', 'Suspended'),
        ('banned', 'Banned'),
    ]
    VERIFICATION_TIER_CHOICES = [
        ('unverified', 'Unverified'),
        ('phone_verified', 'Phone Verified'),
        ('id_verified', 'ID Verified'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    email = models.EmailField(unique=True)
    first_name = models.CharField(max_length=50)
    last_name = models.CharField(max_length=50)
    phone = models.CharField(max_length=20, blank=True)
    phone_verified = models.BooleanField(default=False)
    user_type = models.CharField(max_length=10, choices=USER_TYPE_CHOICES)
    auth_provider = models.CharField(max_length=10, choices=AUTH_PROVIDER_CHOICES, default='email')
    google_id = models.CharField(max_length=255, null=True, blank=True, unique=True)
    country = models.CharField(max_length=2, blank=True)
    city = models.CharField(max_length=100, blank=True)
    # Trust & safety
    account_status = models.CharField(max_length=10, choices=ACCOUNT_STATUS_CHOICES, default='active')
    verification_tier = models.CharField(max_length=20, choices=VERIFICATION_TIER_CHOICES, default='unverified')
    cancellation_count = models.IntegerField(default=0)
    is_suspicious = models.BooleanField(default=False)  # flagged by device fingerprint detection
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    objects = UserManager()

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['first_name', 'last_name', 'user_type']

    def __str__(self):
        return f'{self.first_name} {self.last_name} ({self.email})'

    @property
    def full_name(self):
        return f'{self.first_name} {self.last_name}'


class HaulerProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='hauler_profile')
    bio = models.TextField(blank=True)
    skills = models.JSONField(default=list)
    profile_photo = models.ImageField(upload_to='hauler_photos/', null=True, blank=True)
    rating_avg = models.DecimalField(max_digits=3, decimal_places=2, default=0.00)
    review_count = models.IntegerField(default=0)
    # Reliability tracking (used by no-show strike system)
    no_show_count = models.IntegerField(default=0)
    abandonment_count = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f'Profile: {self.user.full_name}'


class DeviceSession(models.Model):
    """
    Logs device fingerprints per login (Task 17).
    Used by the cross-account detection Celery task to flag Sybil attacks /
    wash trading when the same device appears on both sides of a booking.
    Only populated when SECURITY['DEVICE_FINGERPRINT_ENABLED'] = True (prod).
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='device_sessions')
    fingerprint = models.CharField(max_length=128, db_index=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f'DeviceSession: {self.user.email} — {self.fingerprint[:16]}…'
