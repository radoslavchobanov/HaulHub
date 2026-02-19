from django.db.models import Q
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status

from .models import ChatRoom, Message
from .serializers import ChatRoomSerializer, MessageSerializer


@api_view(['GET'])
def chat_rooms(request):
    if request.user.user_type == 'client':
        rooms = ChatRoom.objects.filter(
            Q(booking__client=request.user) | Q(application__job__client=request.user)
        ).select_related(
            'booking', 'booking__hauler', 'booking__job',
            'application', 'application__job', 'application__hauler',
        )
    else:
        rooms = ChatRoom.objects.filter(
            Q(booking__hauler=request.user) | Q(application__hauler=request.user)
        ).select_related(
            'booking', 'booking__client', 'booking__job',
            'application', 'application__job', 'application__job__client',
        )

    return Response(ChatRoomSerializer(rooms, many=True, context={'request': request}).data)


@api_view(['GET'])
def room_messages(request, pk):
    try:
        room = ChatRoom.objects.select_related(
            'booking', 'application__job'
        ).get(id=pk)
    except ChatRoom.DoesNotExist:
        return Response({'error': 'Chat room not found.'}, status=status.HTTP_404_NOT_FOUND)

    if room.booking:
        client, hauler = room.booking.client, room.booking.hauler
    elif room.application:
        client = room.application.job.client
        hauler = room.application.hauler
    else:
        return Response({'error': 'Forbidden.'}, status=status.HTTP_403_FORBIDDEN)

    if request.user != client and request.user != hauler:
        return Response({'error': 'Forbidden.'}, status=status.HTTP_403_FORBIDDEN)

    messages = room.messages.select_related('sender').order_by('sent_at')
    room.messages.filter(is_read=False).exclude(sender=request.user).update(is_read=True)

    return Response(MessageSerializer(messages, many=True).data)


@api_view(['POST'])
def report_message(request, room_pk, message_pk):
    """
    User-initiated report of a suspicious message (e.g. off-platform solicitation).
    Sets is_flagged=True on the message and logs it for admin review.
    """
    try:
        room = ChatRoom.objects.select_related(
            'booking', 'application__job'
        ).get(id=room_pk)
    except ChatRoom.DoesNotExist:
        return Response({'error': 'Chat room not found.'}, status=status.HTTP_404_NOT_FOUND)

    # Verify requester is a party to this room
    if room.booking:
        client, hauler = room.booking.client, room.booking.hauler
    elif room.application:
        client = room.application.job.client
        hauler = room.application.hauler
    else:
        return Response({'error': 'Forbidden.'}, status=status.HTTP_403_FORBIDDEN)

    if request.user != client and request.user != hauler:
        return Response({'error': 'Forbidden.'}, status=status.HTTP_403_FORBIDDEN)

    try:
        message = room.messages.get(id=message_pk)
    except Message.DoesNotExist:
        return Response({'error': 'Message not found.'}, status=status.HTTP_404_NOT_FOUND)

    message.is_flagged = True
    message.save(update_fields=['is_flagged'])

    return Response({'message': 'Message reported. Our team will review it.'})
