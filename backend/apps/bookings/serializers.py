from rest_framework import serializers
from django.utils import timezone
from .models import Booking
from apps.users.serializers import UserSerializer
from apps.jobs.serializers import JobSerializer


class BookingSerializer(serializers.ModelSerializer):
    client = UserSerializer(read_only=True)
    hauler = UserSerializer(read_only=True)
    job = JobSerializer(read_only=True)
    chat_room_id = serializers.SerializerMethodField()
    days_until_auto_release = serializers.SerializerMethodField()
    can_review = serializers.SerializerMethodField()

    class Meta:
        model = Booking
        fields = [
            'id', 'job', 'client', 'hauler', 'amount', 'status',
            'escrow_locked_at', 'auto_release_at', 'completed_at',
            'created_at', 'chat_room_id', 'days_until_auto_release', 'can_review',
        ]

    def get_chat_room_id(self, obj):
        try:
            return str(obj.chat_room.id)
        except Exception:
            return None

    def get_days_until_auto_release(self, obj):
        if obj.auto_release_at and obj.status == 'active':
            delta = obj.auto_release_at - timezone.now()
            return max(0, delta.days)
        return None

    def get_can_review(self, obj):
        request = self.context.get('request')
        if not request or obj.status != 'completed':
            return False
        from apps.reviews.models import Review
        return not Review.objects.filter(booking=obj, reviewer=request.user).exists()
