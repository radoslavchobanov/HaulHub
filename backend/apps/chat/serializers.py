from rest_framework import serializers
from .models import ChatRoom, Message
from apps.users.serializers import UserSerializer


class MessageSerializer(serializers.ModelSerializer):
    sender = UserSerializer(read_only=True)

    class Meta:
        model = Message
        fields = ['id', 'chat_room', 'sender', 'content', 'sent_at', 'is_read']


class ChatRoomSerializer(serializers.ModelSerializer):
    booking_info = serializers.SerializerMethodField()
    last_message = serializers.SerializerMethodField()
    unread_count = serializers.SerializerMethodField()

    class Meta:
        model = ChatRoom
        fields = ['id', 'booking_info', 'last_message', 'unread_count', 'created_at']

    def get_booking_info(self, obj):
        request = self.context.get('request')
        booking = obj.booking
        other_party = None
        if request:
            if booking.client == request.user:
                other_party = UserSerializer(booking.hauler).data
            else:
                other_party = UserSerializer(booking.client).data
        return {
            'id': str(booking.id),
            'job_title': booking.job.title,
            'status': booking.status,
            'other_party': other_party,
        }

    def get_last_message(self, obj):
        msg = obj.messages.order_by('-sent_at').first()
        return MessageSerializer(msg).data if msg else None

    def get_unread_count(self, obj):
        request = self.context.get('request')
        if request:
            return obj.messages.filter(is_read=False).exclude(sender=request.user).count()
        return 0
