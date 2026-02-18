import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { useMutation } from '@tanstack/react-query'
import { GoogleLogin } from '@react-oauth/google'
import { authApi } from '../api/auth'
import { useAuthStore } from '../stores/authStore'

interface LoginForm {
  email: string
  password: string
}

export default function Login() {
  const navigate = useNavigate()
  const location = useLocation()
  const { setAuth } = useAuthStore()
  const [googleError, setGoogleError] = useState('')

  const from = (location.state as any)?.from || null

  const { register, handleSubmit, formState: { errors } } = useForm<LoginForm>()

  const loginMutation = useMutation({
    mutationFn: (data: LoginForm) => authApi.login(data.email, data.password),
    onSuccess: ({ data }) => {
      setAuth(data.user, data.tokens)
      navigate(from || (data.user.user_type === 'client' ? '/dashboard' : '/board'))
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
      navigate(from || (data.user.user_type === 'client' ? '/dashboard' : '/board'))
    } catch {
      setGoogleError('Google sign-in failed. Please try again.')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <Link to="/" className="flex justify-center items-center gap-2 mb-6">
          <span className="text-3xl">🚛</span>
          <span className="text-2xl font-bold text-brand-700">HaulHub</span>
        </Link>
        <h2 className="text-center text-2xl font-bold text-gray-900">Sign in to your account</h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Don't have an account?{' '}
          <Link to="/register" className="font-medium text-brand-600 hover:text-brand-500">
            Sign up for free
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 shadow-sm rounded-xl border border-gray-200">
          <form onSubmit={handleSubmit((data) => loginMutation.mutate(data))} className="space-y-4">
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
                {...register('password', { required: 'Password is required' })}
                type="password"
                className="input"
                placeholder="••••••••"
              />
              {errors.password && <p className="mt-1 text-xs text-red-600">{errors.password.message}</p>}
            </div>

            {loginMutation.isError && (
              <p className="text-sm text-red-600 bg-red-50 rounded-lg p-3">
                {(loginMutation.error as any)?.response?.data?.non_field_errors?.[0] || 'Invalid email or password.'}
              </p>
            )}

            <button type="submit" disabled={loginMutation.isPending} className="btn-primary w-full">
              {loginMutation.isPending ? 'Signing in...' : 'Sign in'}
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
                onError={() => setGoogleError('Google sign-in failed.')}
                useOneTap={false}
              />
            </div>
            {googleError && <p className="mt-2 text-sm text-red-600 text-center">{googleError}</p>}
          </div>
        </div>
      </div>
    </div>
  )
}
