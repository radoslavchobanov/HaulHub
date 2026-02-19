from datetime import timedelta

from django.utils import timezone
from rest_framework import serializers
from django.contrib.auth import authenticate
from .models import User, HaulerProfile


class HaulerProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = HaulerProfile
        fields = ['bio', 'skills', 'profile_photo', 'rating_avg', 'review_count', 'no_show_count']


class UserSerializer(serializers.ModelSerializer):
    hauler_profile = HaulerProfileSerializer(read_only=True)
    full_name = serializers.CharField(read_only=True)
    cancellation_rate = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            'id', 'email', 'first_name', 'last_name', 'full_name',
            'phone', 'phone_verified', 'user_type', 'auth_provider',
            'country', 'city', 'account_status', 'verification_tier',
            'cancellation_rate', 'created_at', 'hauler_profile',
        ]

    def get_cancellation_rate(self, obj):
        """30-day cancellation rate as a percentage. Only meaningful for clients."""
        if obj.user_type != 'client':
            return None
        from apps.jobs.models import Job
        now = timezone.now()
        thirty_days_ago = now - timedelta(days=30)
        total = Job.objects.filter(client=obj, created_at__gte=thirty_days_ago).count()
        if total == 0:
            return 0
        cancelled = Job.objects.filter(
            client=obj, status='cancelled', updated_at__gte=thirty_days_ago
        ).count()
        return round((cancelled / total) * 100, 1)


class UpdateUserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['first_name', 'last_name', 'phone', 'country', 'city']

    def update(self, instance, validated_data):
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save(update_fields=list(validated_data.keys()))
        return instance


class RegisterSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True, min_length=8)
    first_name = serializers.CharField(max_length=50)
    last_name = serializers.CharField(max_length=50)
    phone = serializers.CharField(max_length=20, required=False, allow_blank=True)
    user_type = serializers.ChoiceField(choices=['client', 'hauler'])

    def validate_email(self, value):
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError('An account with this email already exists.')
        return value

    def create(self, validated_data):
        return User.objects.create_user(**validated_data)


class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField()

    def validate(self, data):
        user = authenticate(username=data['email'], password=data['password'])
        if not user:
            raise serializers.ValidationError('Invalid email or password.')
        if not user.is_active:
            raise serializers.ValidationError('Account is disabled.')
        data['user'] = user
        return data
