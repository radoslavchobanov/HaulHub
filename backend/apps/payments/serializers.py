from django.utils import timezone
from rest_framework import serializers
from .models import Wallet, Transaction


class TransactionSerializer(serializers.ModelSerializer):
    transaction_type_display = serializers.CharField(source='get_transaction_type_display', read_only=True)

    class Meta:
        model = Transaction
        fields = [
            'id', 'transaction_type', 'transaction_type_display',
            'amount', 'description', 'available_at', 'is_processed', 'created_at',
        ]


class WalletSerializer(serializers.ModelSerializer):
    transactions = TransactionSerializer(many=True, read_only=True)
    total_balance = serializers.SerializerMethodField()
    pending_balance = serializers.SerializerMethodField()

    class Meta:
        model = Wallet
        fields = [
            'available_balance', 'escrow_balance', 'reserve_balance',
            'pending_balance', 'total_balance', 'transactions',
        ]

    def get_total_balance(self, obj):
        return obj.available_balance + obj.escrow_balance + obj.reserve_balance

    def get_pending_balance(self, obj):
        """Sum of deposits that haven't cleared the hold period yet."""
        now = timezone.now()
        result = obj.transactions.filter(
            transaction_type='deposit',
            is_processed=False,
            available_at__gt=now,
        ).values_list('amount', flat=True)
        return sum(result) if result else 0
