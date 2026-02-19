from rest_framework import serializers
from .models import Job, JobApplication
from apps.users.serializers import UserSerializer


class CreateJobSerializer(serializers.ModelSerializer):
    class Meta:
        model = Job
        fields = ['title', 'description', 'category', 'budget', 'country', 'city', 'neighborhood', 'scheduled_date']


class SimpleJobSerializer(serializers.ModelSerializer):
    class Meta:
        model = Job
        fields = ['id', 'title', 'budget', 'scheduled_date', 'city', 'country', 'status']


class JobApplicationSerializer(serializers.ModelSerializer):
    hauler = UserSerializer(read_only=True)
    job = SimpleJobSerializer(read_only=True)
    chat_room_id = serializers.SerializerMethodField()

    class Meta:
        model = JobApplication
        fields = ['id', 'job', 'hauler', 'proposal_message', 'status', 'chat_room_id', 'created_at']
        read_only_fields = ['id', 'status', 'hauler', 'job', 'created_at']

    def get_chat_room_id(self, obj):
        try:
            return str(obj.chat_room.id)
        except Exception:
            return None


class JobSerializer(serializers.ModelSerializer):
    client = UserSerializer(read_only=True)
    category_display = serializers.CharField(source='get_category_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    location_display = serializers.CharField(read_only=True)
    application_count = serializers.SerializerMethodField()
    my_application = serializers.SerializerMethodField()

    class Meta:
        model = Job
        fields = [
            'id', 'client', 'title', 'description', 'category', 'category_display',
            'budget', 'country', 'city', 'neighborhood', 'location_display',
            'scheduled_date', 'status', 'status_display',
            'application_count', 'my_application', 'created_at', 'updated_at',
        ]

    def get_application_count(self, obj):
        return obj.applications.count()

    def get_my_application(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated and request.user.user_type == 'hauler':
            try:
                app = obj.applications.get(hauler=request.user)
                return JobApplicationSerializer(app).data
            except JobApplication.DoesNotExist:
                return None
        return None
