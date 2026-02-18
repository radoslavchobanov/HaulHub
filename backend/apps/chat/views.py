from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status

from .models import ChatRoom, Message
from .serializers import ChatRoomSerializer, MessageSerializer


@api_view(['GET'])
def chat_rooms(request):
    if request.user.user_type == 'client':
        rooms = ChatRoom.objects.filter(
            booking__client=request.user
        ).select_related('booking', 'booking__hauler', 'booking__job')
    else:
        rooms = ChatRoom.objects.filter(
            booking__hauler=request.user
        ).select_related('booking', 'booking__client', 'booking__job')

    return Response(ChatRoomSerializer(rooms, many=True, context={'request': request}).data)


@api_view(['GET'])
def room_messages(request, pk):
    try:
        room = ChatRoom.objects.select_related('booking').get(id=pk)
    except ChatRoom.DoesNotExist:
        return Response({'error': 'Chat room not found.'}, status=status.HTTP_404_NOT_FOUND)

    booking = room.booking
    if booking.client != request.user and booking.hauler != request.user:
        return Response({'error': 'Forbidden.'}, status=status.HTTP_403_FORBIDDEN)

    messages = room.messages.select_related('sender').order_by('sent_at')

    # Mark others' messages as read
    room.messages.filter(is_read=False).exclude(sender=request.user).update(is_read=True)

    return Response(MessageSerializer(messages, many=True).data)
