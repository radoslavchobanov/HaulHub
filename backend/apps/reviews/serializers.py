from rest_framework import serializers
from .models import Review
from apps.users.serializers import UserSerializer


class ReviewSerializer(serializers.ModelSerializer):
    reviewer = UserSerializer(read_only=True)
    reviewee = UserSerializer(read_only=True)

    class Meta:
        model = Review
        fields = ['id', 'booking', 'reviewer', 'reviewee', 'rating', 'comment', 'created_at']
        read_only_fields = ['id', 'reviewer', 'reviewee', 'booking', 'created_at']
