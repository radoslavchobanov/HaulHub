import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useSearchParams } from 'react-router-dom'
import { paymentsApi } from '../../api/payments'
import { PageLoader } from '../../components/ui/LoadingSpinner'
import { format } from 'date-fns'

const transactionIcon: Record<string, string> = {
  deposit: '⬇️',
  escrow_lock: '🔒',
  escrow_release: '✅',
  withdrawal: '⬆️',
}

export default function Wallet() {
  const [amount, setAmount] = useState('')
  const [searchParams] = useSearchParams()
  const queryClient = useQueryClient()

  const depositStatus = searchParams.get('deposit')

  const { data: wallet, isLoading } = useQuery({
    queryKey: ['wallet'],
    queryFn: () => paymentsApi.getWallet().then((r) => r.data),
  })

  useEffect(() => {
    if (depositStatus === 'success') {
      queryClient.invalidateQueries({ queryKey: ['wallet'] })
    }
  }, [depositStatus, queryClient])

  const depositMutation = useMutation({
    mutationFn: () => paymentsApi.deposit(amount),
    onSuccess: ({ data }) => {
      window.location.href = data.checkout_url
    },
  })

  if (isLoading) return <PageLoader />

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Wallet</h1>
        <p className="text-gray-600 mt-1">Manage your HaulHub balance</p>
      </div>

      {depositStatus === 'success' && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-sm text-green-800">
          ✓ Your deposit was successful! Funds will appear in your balance shortly.
        </div>
      )}

      {depositStatus === 'cancelled' && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 text-sm text-yellow-800">
          Your deposit was cancelled. No charges were made.
        </div>
      )}

      {/* Balance cards */}
      <div className="grid sm:grid-cols-2 gap-4">
        <div className="card bg-brand-700 text-white">
          <p className="text-brand-200 text-sm mb-1">Available Balance</p>
          <p className="text-3xl font-bold">${wallet?.available_balance}</p>
          <p className="text-brand-200 text-xs mt-2">Available to spend on jobs</p>
        </div>
        <div className="card bg-yellow-50 border-yellow-200">
          <p className="text-yellow-700 text-sm mb-1">In Escrow</p>
          <p className="text-3xl font-bold text-yellow-800">${wallet?.escrow_balance}</p>
          <p className="text-yellow-600 text-xs mt-2">Locked for active bookings</p>
        </div>
      </div>

      {/* Deposit form */}
      <div className="card">
        <h2 className="font-semibold text-gray-900 mb-4">Add Funds</h2>
        <div className="flex gap-3">
          <div className="relative flex-1">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
            <input
              type="number"
              min="1"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="input pl-7"
              placeholder="100.00"
            />
          </div>
          <button
            onClick={() => depositMutation.mutate()}
            disabled={!amount || parseFloat(amount) < 1 || depositMutation.isPending}
            className="btn-primary"
          >
            {depositMutation.isPending ? 'Redirecting...' : 'Deposit via Stripe'}
          </button>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          Secure payments powered by Stripe. Funds appear in your balance after payment confirmation.
        </p>
      </div>

      {/* Transaction history */}
      <div className="card">
        <h2 className="font-semibold text-gray-900 mb-4">Transaction History</h2>
        {wallet?.transactions.length === 0 && (
          <p className="text-sm text-gray-500 text-center py-8">No transactions yet.</p>
        )}
        <div className="space-y-3">
          {wallet?.transactions.map((tx) => (
            <div key={tx.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
              <div className="flex items-center gap-3">
                <span className="text-lg">{transactionIcon[tx.transaction_type] || '💳'}</span>
                <div>
                  <p className="text-sm font-medium text-gray-900">{tx.description}</p>
                  <p className="text-xs text-gray-500">{format(new Date(tx.created_at), 'MMM d, yyyy · HH:mm')}</p>
                </div>
              </div>
              <span className={`text-sm font-semibold ${
                tx.transaction_type === 'deposit' || tx.transaction_type === 'escrow_release'
                  ? 'text-green-600'
                  : 'text-gray-700'
              }`}>
                {tx.transaction_type === 'deposit' || (tx.transaction_type === 'escrow_release')
                  ? `+$${tx.amount}`
                  : `-$${tx.amount}`}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
