from django.urls import path
from . import views

urlpatterns = [
    path('rooms/', views.chat_rooms, name='chat-rooms'),
    path('rooms/<uuid:pk>/messages/', views.room_messages, name='room-messages'),
]
