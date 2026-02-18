from django.contrib import admin
from .models import ChatRoom, Message


@admin.register(ChatRoom)
class ChatRoomAdmin(admin.ModelAdmin):
    list_display = ('booking', 'created_at')
    search_fields = ('booking__job__title',)


@admin.register(Message)
class MessageAdmin(admin.ModelAdmin):
    list_display = ('sender', 'chat_room', 'content', 'sent_at', 'is_read')
    list_filter = ('is_read',)
    search_fields = ('sender__email', 'content')
    ordering = ('-sent_at',)
