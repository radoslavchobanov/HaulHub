import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { authApi } from '../api/auth'
import { useAuthStore } from '../stores/authStore'

const TruckIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
  </svg>
)

const BriefcaseIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 14.15v4.25c0 1.094-.787 2.036-1.872 2.18-2.087.277-4.216.42-6.378.42s-4.291-.143-6.378-.42c-1.085-.144-1.872-1.086-1.872-2.18v-4.25m16.5 0a2.18 2.18 0 00.75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 00-3.413-.387m4.5 8.006c-.194.165-.42.295-.673.38A23.978 23.978 0 0112 15.75c-2.648 0-5.195-.429-7.577-1.22a2.016 2.016 0 01-.673-.38m0 0A2.18 2.18 0 013 12.489V8.706c0-1.081.768-2.015 1.837-2.175a48.111 48.111 0 013.413-.387m7.5 0V5.25A2.25 2.25 0 0013.5 3h-3a2.25 2.25 0 00-2.25 2.25v.894m7.5 0a48.667 48.667 0 00-7.5 0M12 12.75h.008v.008H12v-.008z" />
  </svg>
)

const HaulerTruckIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
  </svg>
)

const typeConfig = {
  client: {
    icon: BriefcaseIcon,
    label: 'I need help',
    sublabel: 'Post jobs for Haulers',
  },
  hauler: {
    icon: HaulerTruckIcon,
    label: 'I want to work',
    sublabel: 'Pick up jobs & earn',
  },
} as const

export default function RegisterType() {
  const navigate = useNavigate()
  const location = useLocation()
  const { setAuth } = useAuthStore()
  const state = location.state as { token: string; email: string; first_name: string; last_name: string } | null
  const [userType, setUserType] = useState<'client' | 'hauler'>('client')

  const mutation = useMutation({
    mutationFn: () => authApi.googleAuth(state!.token, userType),
    onSuccess: ({ data }) => {
      setAuth(data.user, data.tokens)
      navigate(data.user.user_type === 'client' ? '/dashboard' : '/board')
    },
  })

  if (!state?.token) {
    navigate('/register')
    return null
  }

  return (
    <div className="min-h-screen bg-navy-900 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Radial brand glow */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-brand-600/10 blur-3xl" />
        <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-brand-500/10 blur-3xl" />
      </div>

      <div className="relative bg-white dark:bg-navy-800 rounded-2xl shadow-xl border border-navy-100 dark:border-navy-700 p-8 w-full max-w-md">
        {/* Logo */}
        <div className="flex items-center gap-2 mb-8">
          <div className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center">
            <TruckIcon className="w-5 h-5 text-white" />
          </div>
          <Link to="/" className="text-xl font-bold text-navy-900 dark:text-white">
            HaulHub
          </Link>
        </div>

        {/* Heading */}
        <h1 className="text-2xl font-bold text-navy-900 dark:text-white">
          Welcome, {state.first_name}!
        </h1>
        <p className="mt-2 text-navy-500 dark:text-navy-400 text-sm">
          One last step &mdash; how will you use HaulHub?
        </p>

        {/* Type selection */}
        <div className="grid grid-cols-2 gap-4 mt-8 mb-8">
          {(['client', 'hauler'] as const).map((type) => {
            const { icon: Icon, label, sublabel } = typeConfig[type]
            const selected = userType === type
            return (
              <button
                key={type}
                onClick={() => setUserType(type)}
                className={`flex flex-col items-center p-5 rounded-xl border-2 transition-all duration-150 cursor-pointer ${
                  selected
                    ? 'border-brand-600 bg-brand-50 dark:bg-brand-900/20'
                    : 'border-navy-200 dark:border-navy-600 hover:border-navy-300 dark:hover:border-navy-500'
                }`}
              >
                <Icon
                  className={`w-7 h-7 mb-2 ${
                    selected ? 'text-brand-600' : 'text-navy-400 dark:text-navy-500'
                  }`}
                />
                <span
                  className={`font-semibold text-sm ${
                    selected
                      ? 'text-navy-900 dark:text-white'
                      : 'text-navy-700 dark:text-navy-300'
                  }`}
                >
                  {label}
                </span>
                <span
                  className={`text-xs text-center mt-1 ${
                    selected
                      ? 'text-brand-600/80 dark:text-brand-400/80'
                      : 'text-navy-400 dark:text-navy-500'
                  }`}
                >
                  {sublabel}
                </span>
              </button>
            )
          })}
        </div>

        {mutation.isError && (
          <p className="text-sm text-red-600 bg-red-50 dark:bg-red-900/20 dark:text-red-400 rounded-xl p-3 border border-red-100 dark:border-red-800/50 mb-4">
            Something went wrong. Please try again.
          </p>
        )}

        <button
          onClick={() => mutation.mutate()}
          disabled={mutation.isPending}
          className="btn-primary w-full cursor-pointer transition-all duration-150"
        >
          {mutation.isPending
            ? 'Setting up account...'
            : `Continue as ${userType === 'client' ? 'Client' : 'Hauler'}`}
        </button>
      </div>
    </div>
  )
}
