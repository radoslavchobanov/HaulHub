from django.contrib import admin
from .models import Booking, JobEvidence


class JobEvidenceInline(admin.TabularInline):
    model = JobEvidence
    extra = 0
    readonly_fields = ('evidence_type', 'photo', 'lat', 'lng', 'captured_at', 'submitted_by')
    can_delete = False


@admin.register(Booking)
class BookingAdmin(admin.ModelAdmin):
    list_display = ('job', 'client', 'hauler', 'amount', 'status', 'escrow_locked_at', 'hauler_marked_done_at')
    list_filter = ('status',)
    search_fields = ('job__title', 'client__email', 'hauler__email')
    ordering = ('-created_at',)
    readonly_fields = (
        'escrow_locked_at', 'pickup_confirmed_at', 'hauler_marked_done_at',
        'dispute_opened_at', 'auto_release_at', 'completed_at', 'created_at',
        'pickup_pin',
    )
    inlines = [JobEvidenceInline]

    def get_queryset(self, request):
        qs = super().get_queryset(request)
        return qs.select_related('job', 'client', 'hauler')


@admin.register(JobEvidence)
class JobEvidenceAdmin(admin.ModelAdmin):
    list_display = ('booking', 'evidence_type', 'submitted_by', 'captured_at', 'lat', 'lng')
    list_filter = ('evidence_type',)
    readonly_fields = ('booking', 'submitted_by', 'evidence_type', 'photo', 'lat', 'lng', 'captured_at')
    ordering = ('-captured_at',)
