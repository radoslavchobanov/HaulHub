import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.contrib.auth.models import AnonymousUser


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
        message = await self.save_message(user, content)

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
                },
            }
        )

    async def chat_message(self, event):
        await self.send(text_data=json.dumps(event['message']))

    @database_sync_to_async
    def check_access(self, user, room_id):
        from .models import ChatRoom
        try:
            room = ChatRoom.objects.select_related('booking').get(id=room_id)
            return room.booking.client == user or room.booking.hauler == user
        except ChatRoom.DoesNotExist:
            return False

    @database_sync_to_async
    def save_message(self, user, content):
        from .models import ChatRoom, Message
        room = ChatRoom.objects.get(id=self.room_id)
        return Message.objects.create(chat_room=room, sender=user, content=content)
