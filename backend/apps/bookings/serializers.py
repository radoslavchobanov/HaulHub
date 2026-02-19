from datetime import timedelta

from django.conf import settings
from django.utils import timezone
from rest_framework import serializers

from .models import Booking, JobEvidence
from apps.users.serializers import UserSerializer
from apps.jobs.serializers import JobSerializer

SEC = settings.SECURITY


class JobEvidenceSerializer(serializers.ModelSerializer):
    class Meta:
        model = JobEvidence
        fields = ['id', 'evidence_type', 'photo', 'lat', 'lng', 'captured_at']
        read_only_fields = ['id', 'evidence_type', 'photo', 'lat', 'lng', 'captured_at']


class BookingSerializer(serializers.ModelSerializer):
    client = UserSerializer(read_only=True)
    hauler = UserSerializer(read_only=True)
    job = JobSerializer(read_only=True)
    evidence = JobEvidenceSerializer(many=True, read_only=True)
    chat_room_id = serializers.SerializerMethodField()
    hours_until_auto_release = serializers.SerializerMethodField()
    can_review = serializers.SerializerMethodField()
    # PIN is only exposed to the hauler
    pickup_pin = serializers.SerializerMethodField()

    class Meta:
        model = Booking
        fields = [
            'id', 'job', 'client', 'hauler', 'amount', 'status',
            'pickup_pin',
            'escrow_locked_at', 'pickup_confirmed_at', 'hauler_marked_done_at',
            'dispute_opened_at', 'auto_release_at', 'completed_at', 'created_at',
            'evidence', 'chat_room_id', 'hours_until_auto_release', 'can_review',
        ]

    def get_pickup_pin(self, obj):
        """Only the hauler sees the PIN."""
        request = self.context.get('request')
        if request and request.user == obj.hauler:
            return obj.pickup_pin
        return None

    def get_chat_room_id(self, obj):
        try:
            return str(obj.chat_room.id)
        except Exception:
            return None

    def get_hours_until_auto_release(self, obj):
        if obj.auto_release_at and obj.status == 'pending_completion':
            delta = obj.auto_release_at - timezone.now()
            total_hours = delta.total_seconds() / 3600
            return max(0, round(total_hours, 1))
        return None

    def get_can_review(self, obj):
        request = self.context.get('request')
        if not request or obj.status not in ('completed', 'resolved_hauler', 'resolved_client'):
            return False
        cooling_minutes = SEC.get('REVIEW_COOLING_PERIOD_MINUTES', 60)
        if obj.completed_at and timezone.now() < obj.completed_at + timedelta(minutes=cooling_minutes):
            return False
        from apps.reviews.models import Review
        return not Review.objects.filter(booking=obj, reviewer=request.user).exists()
