from django.contrib import admin
from .models import Booking


@admin.register(Booking)
class BookingAdmin(admin.ModelAdmin):
    list_display = ('job', 'client', 'hauler', 'amount', 'status', 'escrow_locked_at', 'auto_release_at')
    list_filter = ('status',)
    search_fields = ('job__title', 'client__email', 'hauler__email')
    ordering = ('-created_at',)
    readonly_fields = ('escrow_locked_at', 'auto_release_at', 'completed_at', 'created_at')
