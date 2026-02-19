import uuid
from django.db import models
from django.conf import settings


class ChatRoom(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    booking = models.OneToOneField(
        'bookings.Booking', on_delete=models.CASCADE, related_name='chat_room',
        null=True, blank=True
    )
    application = models.OneToOneField(
        'jobs.JobApplication', on_delete=models.CASCADE, related_name='chat_room',
        null=True, blank=True
    )
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        if self.booking:
            return f'Chat: {self.booking.job.title}'
        if self.application:
            return f'Chat (negotiating): {self.application.job.title}'
        return f'Chat: {self.id}'


class Message(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    chat_room = models.ForeignKey(ChatRoom, on_delete=models.CASCADE, related_name='messages')
    sender = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='sent_messages'
    )
    content = models.TextField()
    sent_at = models.DateTimeField(auto_now_add=True)
    is_read = models.BooleanField(default=False)
    # Set by keyword filter when off-platform solicitation patterns are detected
    is_flagged = models.BooleanField(default=False)

    class Meta:
        ordering = ['sent_at']

    def __str__(self):
        return f'{self.sender.full_name}: {self.content[:50]}'
