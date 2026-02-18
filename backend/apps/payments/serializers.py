from rest_framework import serializers
from .models import Wallet, Transaction


class TransactionSerializer(serializers.ModelSerializer):
    transaction_type_display = serializers.CharField(source='get_transaction_type_display', read_only=True)

    class Meta:
        model = Transaction
        fields = ['id', 'transaction_type', 'transaction_type_display', 'amount', 'description', 'created_at']


class WalletSerializer(serializers.ModelSerializer):
    transactions = TransactionSerializer(many=True, read_only=True)
    total_balance = serializers.SerializerMethodField()

    class Meta:
        model = Wallet
        fields = ['available_balance', 'escrow_balance', 'total_balance', 'transactions']

    def get_total_balance(self, obj):
        return obj.available_balance + obj.escrow_balance
