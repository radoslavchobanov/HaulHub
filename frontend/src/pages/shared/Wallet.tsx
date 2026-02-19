import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useSearchParams } from 'react-router-dom'
import { paymentsApi } from '../../api/payments'
import { PageLoader } from '../../components/ui/LoadingSpinner'
import { format } from 'date-fns'

function TxIcon({ type }: { type: string }) {
  const cls = 'w-5 h-5'
  if (type === 'deposit') return (
    <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
    </svg>
  )
  if (type === 'escrow_lock') return (
    <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
    </svg>
  )
  if (type === 'escrow_release') return (
    <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 10.5V6.75a4.5 4.5 0 119 0v3.75M3.75 21.75h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H3.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
    </svg>
  )
  if (type === 'withdrawal') return (
    <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
    </svg>
  )
  return (
    <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" />
    </svg>
  )
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
        <h1 className="text-2xl font-bold text-navy-900 dark:text-white">Wallet</h1>
        <p className="text-navy-600 dark:text-navy-400 mt-1">Manage your HaulHub balance</p>
      </div>

      {depositStatus === 'success' && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-sm text-green-800 dark:bg-green-900/20 dark:border-green-800 dark:text-green-400 flex items-center gap-2">
          <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
          </svg>
          Your deposit was successful! Funds will appear in your balance shortly.
        </div>
      )}

      {depositStatus === 'cancelled' && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 text-sm text-yellow-800 dark:bg-yellow-900/20 dark:border-yellow-800 dark:text-yellow-300">
          Your deposit was cancelled. No charges were made.
        </div>
      )}

      {/* Balance cards */}
      <div className="grid sm:grid-cols-2 gap-4">
        <div className="card bg-brand-700 text-white border-0">
          <p className="text-brand-200 text-sm mb-1">Available Balance</p>
          <p className="text-3xl font-bold">${wallet?.available_balance}</p>
          <p className="text-brand-200 text-xs mt-2">Available to spend on jobs</p>
        </div>
        <div className="card bg-yellow-50 border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-800">
          <p className="text-yellow-700 dark:text-yellow-400 text-sm mb-1">In Escrow</p>
          <p className="text-3xl font-bold text-yellow-800 dark:text-yellow-300">${wallet?.escrow_balance}</p>
          <p className="text-yellow-600 dark:text-yellow-500 text-xs mt-2">Locked for active bookings</p>
        </div>
      </div>

      {/* Deposit form */}
      <div className="card">
        <h2 className="font-semibold text-navy-900 dark:text-white mb-4">Add Funds</h2>
        <div className="flex gap-3">
          <div className="relative flex-1">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-navy-500 dark:text-navy-400">$</span>
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
        <p className="text-xs text-navy-500 dark:text-navy-400 mt-2">
          Secure payments powered by Stripe. Funds appear in your balance after payment confirmation.
        </p>
      </div>

      {/* Transaction history */}
      <div className="card">
        <h2 className="font-semibold text-navy-900 dark:text-white mb-4">Transaction History</h2>
        {wallet?.transactions.length === 0 && (
          <p className="text-sm text-navy-500 dark:text-navy-400 text-center py-8">No transactions yet.</p>
        )}
        <div className="space-y-3">
          {wallet?.transactions.map((tx) => (
            <div key={tx.id} className="flex items-center justify-between py-2 border-b border-navy-100 dark:border-navy-700 last:border-0">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-navy-100 dark:bg-navy-700 flex items-center justify-center text-navy-500 dark:text-navy-400 shrink-0">
                  <TxIcon type={tx.transaction_type} />
                </div>
                <div>
                  <p className="text-sm font-medium text-navy-900 dark:text-white">{tx.description}</p>
                  <p className="text-xs text-navy-500 dark:text-navy-400">{format(new Date(tx.created_at), 'MMM d, yyyy · HH:mm')}</p>
                </div>
              </div>
              <span className={`text-sm font-semibold ${
                tx.transaction_type === 'deposit' || tx.transaction_type === 'escrow_release'
                  ? 'text-green-600 dark:text-green-400'
                  : 'text-navy-700 dark:text-navy-300'
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
