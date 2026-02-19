from django.urls import path
from . import views

urlpatterns = [
    path('rooms/', views.chat_rooms, name='chat-rooms'),
    path('rooms/<uuid:pk>/messages/', views.room_messages, name='room-messages'),
    path('rooms/<uuid:room_pk>/messages/<uuid:message_pk>/report/', views.report_message, name='report-message'),
]
