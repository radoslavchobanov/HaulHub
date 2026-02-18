from django.contrib import admin
from .models import Job, JobApplication


@admin.register(Job)
class JobAdmin(admin.ModelAdmin):
    list_display = ('title', 'client', 'category', 'budget', 'status', 'scheduled_date', 'created_at')
    list_filter = ('status', 'category')
    search_fields = ('title', 'client__email', 'location_address')
    ordering = ('-created_at',)


@admin.register(JobApplication)
class JobApplicationAdmin(admin.ModelAdmin):
    list_display = ('hauler', 'job', 'status', 'created_at')
    list_filter = ('status',)
    search_fields = ('hauler__email', 'job__title')
    ordering = ('-created_at',)
