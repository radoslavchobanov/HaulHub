import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { authApi } from '../api/auth'
import { useAuthStore } from '../stores/authStore'

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
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <span className="text-4xl">🚛</span>
          <h1 className="text-2xl font-bold text-gray-900 mt-4">Welcome, {state.first_name}!</h1>
          <p className="text-gray-600 mt-2">One last step — how will you use HaulHub?</p>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-8">
          {(['client', 'hauler'] as const).map((type) => (
            <button
              key={type}
              onClick={() => setUserType(type)}
              className={`flex flex-col items-center p-5 rounded-xl border-2 transition-all ${
                userType === type
                  ? 'border-brand-600 bg-brand-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <span className="text-3xl mb-2">{type === 'client' ? '📦' : '💪'}</span>
              <span className="font-semibold text-sm">
                {type === 'client' ? 'I need help' : 'I want to work'}
              </span>
              <span className="text-xs text-gray-500 text-center mt-1">
                {type === 'client' ? 'Post jobs for Haulers' : 'Pick up jobs & earn'}
              </span>
            </button>
          ))}
        </div>

        {mutation.isError && (
          <p className="text-sm text-red-600 bg-red-50 rounded-lg p-3 mb-4">
            Something went wrong. Please try again.
          </p>
        )}

        <button
          onClick={() => mutation.mutate()}
          disabled={mutation.isPending}
          className="btn-primary w-full"
        >
          {mutation.isPending ? 'Setting up account...' : `Continue as ${userType === 'client' ? 'Client' : 'Hauler'}`}
        </button>
      </div>
    </div>
  )
}
