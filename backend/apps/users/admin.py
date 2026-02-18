from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User, HaulerProfile


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display = ('email', 'first_name', 'last_name', 'user_type', 'auth_provider', 'is_active', 'created_at')
    list_filter = ('user_type', 'auth_provider', 'is_active', 'is_staff')
    search_fields = ('email', 'first_name', 'last_name')
    ordering = ('-created_at',)
    fieldsets = (
        (None, {'fields': ('email', 'password')}),
        ('Personal', {'fields': ('first_name', 'last_name', 'phone')}),
        ('Account', {'fields': ('user_type', 'auth_provider', 'google_id')}),
        ('Permissions', {'fields': ('is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions')}),
    )
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('email', 'password1', 'password2', 'first_name', 'last_name', 'user_type'),
        }),
    )


@admin.register(HaulerProfile)
class HaulerProfileAdmin(admin.ModelAdmin):
    list_display = ('user', 'rating_avg', 'review_count')
    search_fields = ('user__email', 'user__first_name')
