from django.contrib import admin
from .models import Wallet, Transaction


@admin.register(Wallet)
class WalletAdmin(admin.ModelAdmin):
    list_display = ('user', 'available_balance', 'escrow_balance', 'updated_at')
    search_fields = ('user__email',)


@admin.register(Transaction)
class TransactionAdmin(admin.ModelAdmin):
    list_display = ('wallet', 'transaction_type', 'amount', 'description', 'created_at')
    list_filter = ('transaction_type',)
    search_fields = ('wallet__user__email', 'reference_id')
    ordering = ('-created_at',)
