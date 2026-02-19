import json
import re

from channels.db import database_sync_to_async
from channels.generic.websocket import AsyncWebsocketConsumer
from django.contrib.auth.models import AnonymousUser

# ---------------------------------------------------------------------------
# Off-platform solicitation keyword filter
# ---------------------------------------------------------------------------
# Matches payment app names, money transfer services, phone numbers and emails.
# Messages matching any pattern are saved with is_flagged=True and delivered
# normally (soft-flag, not blocked) — aggressive blocking causes false positives.
# ---------------------------------------------------------------------------
_PAYMENT_KEYWORDS = re.compile(
    r'\b(venmo|paypal|pay pal|zelle|cashapp|cash app|wise|western union|'
    r'wire transfer|bank transfer|interac|revolut|monzo|chime)\b',
    re.IGNORECASE,
)
_PHONE_RE = re.compile(
    r'(\+?1?\s?\(?\d{3}\)?[\s.\-]\d{3}[\s.\-]\d{4})',
)
_EMAIL_RE = re.compile(
    r'\b[A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Za-z]{2,}\b',
)


def _is_flagged(content: str) -> bool:
    return bool(
        _PAYMENT_KEYWORDS.search(content)
        or _PHONE_RE.search(content)
        or _EMAIL_RE.search(content)
    )


class ChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.room_id = self.scope['url_route']['kwargs']['room_id']
        self.room_group_name = f'chat_{self.room_id}'
        user = self.scope.get('user')

        if not user or isinstance(user, AnonymousUser) or not user.is_authenticated:
            await self.close(code=4001)
            return

        has_access = await self.check_access(user, self.room_id)
        if not has_access:
            await self.close(code=4003)
            return

        await self.channel_layer.group_add(self.room_group_name, self.channel_name)
        await self.accept()

    async def disconnect(self, close_code):
        if hasattr(self, 'room_group_name'):
            await self.channel_layer.group_discard(self.room_group_name, self.channel_name)

    async def receive(self, text_data):
        try:
            data = json.loads(text_data)
        except json.JSONDecodeError:
            return

        content = data.get('content', '').strip()
        if not content:
            return

        user = self.scope['user']
        flagged = _is_flagged(content)
        message = await self.save_message(user, content, flagged)

        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'chat_message',
                'message': {
                    'id': str(message.id),
                    'sender_id': str(user.id),
                    'sender_name': user.full_name,
                    'content': content,
                    'sent_at': message.sent_at.isoformat(),
                    'is_read': False,
                    'is_flagged': flagged,
                },
            }
        )

    async def chat_message(self, event):
        await self.send(text_data=json.dumps(event['message']))

    @database_sync_to_async
    def check_access(self, user, room_id):
        from .models import ChatRoom
        try:
            room = ChatRoom.objects.select_related(
                'booking', 'application__job'
            ).get(id=room_id)
            if room.booking:
                return room.booking.client == user or room.booking.hauler == user
            if room.application:
                return room.application.job.client == user or room.application.hauler == user
            return False
        except ChatRoom.DoesNotExist:
            return False

    @database_sync_to_async
    def save_message(self, user, content, flagged=False):
        from .models import ChatRoom, Message
        room = ChatRoom.objects.get(id=self.room_id)
        return Message.objects.create(
            chat_room=room,
            sender=user,
            content=content,
            is_flagged=flagged,
        )
