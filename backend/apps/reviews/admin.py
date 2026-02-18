from django.contrib import admin
from .models import Review


@admin.register(Review)
class ReviewAdmin(admin.ModelAdmin):
    list_display = ('reviewer', 'reviewee', 'rating', 'booking', 'created_at')
    list_filter = ('rating',)
    search_fields = ('reviewer__email', 'reviewee__email')
    ordering = ('-created_at',)
