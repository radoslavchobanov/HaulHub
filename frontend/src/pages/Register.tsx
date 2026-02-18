import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { useMutation } from '@tanstack/react-query'
import { GoogleLogin } from '@react-oauth/google'
import { authApi } from '../api/auth'
import { useAuthStore } from '../stores/authStore'

interface RegisterForm {
  email: string
  password: string
  first_name: string
  last_name: string
  phone?: string
  user_type: 'client' | 'hauler'
}

export default function Register() {
  const navigate = useNavigate()
  const { setAuth } = useAuthStore()
  const [googleError, setGoogleError] = useState('')

  const { register, handleSubmit, watch, formState: { errors } } = useForm<RegisterForm>({
    defaultValues: { user_type: 'client' },
  })

  const userType = watch('user_type')

  const mutation = useMutation({
    mutationFn: (data: RegisterForm) => authApi.register(data),
    onSuccess: ({ data }) => {
      setAuth(data.user, data.tokens)
      navigate(data.user.user_type === 'client' ? '/dashboard' : '/board')
    },
  })

  const handleGoogleSuccess = async (credentialResponse: any) => {
    setGoogleError('')
    try {
      const { data } = await authApi.googleAuth(credentialResponse.credential)
      if (data.requires_type) {
        navigate('/register/type', {
          state: {
            token: credentialResponse.credential,
            email: data.email,
            first_name: data.first_name,
            last_name: data.last_name,
          },
        })
        return
      }
      setAuth(data.user, data.tokens)
      navigate(data.user.user_type === 'client' ? '/dashboard' : '/board')
    } catch {
      setGoogleError('Google sign-up failed. Please try again.')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <Link to="/" className="flex justify-center items-center gap-2 mb-6">
          <span className="text-3xl">🚛</span>
          <span className="text-2xl font-bold text-brand-700">HaulHub</span>
        </Link>
        <h2 className="text-center text-2xl font-bold text-gray-900">Create your account</h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Already have one?{' '}
          <Link to="/login" className="font-medium text-brand-600 hover:text-brand-500">Sign in</Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 shadow-sm rounded-xl border border-gray-200">
          {/* Account type toggle */}
          <div className="mb-6">
            <label className="label">I want to...</label>
            <div className="grid grid-cols-2 gap-3">
              {(['client', 'hauler'] as const).map((type) => (
                <label
                  key={type}
                  className={`flex flex-col items-center p-4 rounded-xl border-2 cursor-pointer transition-all ${
                    userType === type
                      ? 'border-brand-600 bg-brand-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <input
                    {...register('user_type')}
                    type="radio"
                    value={type}
                    className="sr-only"
                  />
                  <span className="text-2xl mb-1">{type === 'client' ? '📦' : '💪'}</span>
                  <span className="font-medium text-sm">
                    {type === 'client' ? 'Hire Haulers' : 'Work as a Hauler'}
                  </span>
                  <span className="text-xs text-gray-500 text-center mt-0.5">
                    {type === 'client' ? 'Post jobs & get help' : 'Find jobs & earn'}
                  </span>
                </label>
              ))}
            </div>
          </div>

          <form onSubmit={handleSubmit((data) => mutation.mutate(data))} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">First name</label>
                <input
                  {...register('first_name', { required: 'Required' })}
                  className="input"
                  placeholder="John"
                />
                {errors.first_name && <p className="mt-1 text-xs text-red-600">{errors.first_name.message}</p>}
              </div>
              <div>
                <label className="label">Last name</label>
                <input
                  {...register('last_name', { required: 'Required' })}
                  className="input"
                  placeholder="Doe"
                />
                {errors.last_name && <p className="mt-1 text-xs text-red-600">{errors.last_name.message}</p>}
              </div>
            </div>

            <div>
              <label className="label">Email</label>
              <input
                {...register('email', { required: 'Email is required' })}
                type="email"
                className="input"
                placeholder="you@example.com"
              />
              {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email.message}</p>}
            </div>

            <div>
              <label className="label">Password</label>
              <input
                {...register('password', { required: 'Required', minLength: { value: 8, message: 'Minimum 8 characters' } })}
                type="password"
                className="input"
                placeholder="At least 8 characters"
              />
              {errors.password && <p className="mt-1 text-xs text-red-600">{errors.password.message}</p>}
            </div>

            <div>
              <label className="label">Phone (optional)</label>
              <input {...register('phone')} type="tel" className="input" placeholder="+1 (555) 000-0000" />
            </div>

            {mutation.isError && (
              <p className="text-sm text-red-600 bg-red-50 rounded-lg p-3">
                {(mutation.error as any)?.response?.data?.email?.[0] ||
                  (mutation.error as any)?.response?.data?.password?.[0] ||
                  'Registration failed. Please try again.'}
              </p>
            )}

            <button type="submit" disabled={mutation.isPending} className="btn-primary w-full">
              {mutation.isPending ? 'Creating account...' : 'Create account'}
            </button>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">Or continue with</span>
              </div>
            </div>
            <div className="mt-4 flex justify-center">
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={() => setGoogleError('Google sign-up failed.')}
              />
            </div>
            {googleError && <p className="mt-2 text-sm text-red-600 text-center">{googleError}</p>}
          </div>
        </div>
      </div>
    </div>
  )
}
