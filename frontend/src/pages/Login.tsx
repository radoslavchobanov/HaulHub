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

const TruckIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
  </svg>
)

const CheckIcon = () => (
  <svg className="w-4 h-4 text-brand-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
  </svg>
)

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
    <div className="min-h-screen flex">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-[45%] flex-col justify-between bg-navy-900 relative overflow-hidden px-12 py-12">
        {/* Radial brand glow */}
        <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
          <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-brand-600/20 blur-3xl" />
          <div className="absolute bottom-0 right-0 w-64 h-64 rounded-full bg-brand-500/10 blur-2xl" />
        </div>

        {/* Top: Logo + tagline */}
        <div className="relative">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center">
              <TruckIcon className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-white">HaulHub</span>
          </Link>
          <p className="mt-4 text-navy-400 text-sm leading-relaxed">
            Trusted haulers for any physical job
          </p>
        </div>

        {/* Middle: Trust items */}
        <div className="relative mt-auto space-y-4">
          {[
            'Free to join',
            'Secure escrow payments',
            'Verified haulers',
          ].map((item) => (
            <div key={item} className="flex items-center gap-3">
              <CheckIcon />
              <span className="text-navy-300 text-sm">{item}</span>
            </div>
          ))}
        </div>

        {/* Bottom: Copyright */}
        <p className="relative text-navy-500 text-xs mt-12">
          &copy; 2026 HaulHub
        </p>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex flex-col justify-center px-6 sm:px-12 py-12 bg-white dark:bg-navy-800">
        {/* Mobile-only logo */}
        <div className="flex lg:hidden items-center gap-2 mb-8">
          <div className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center">
            <TruckIcon className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold text-navy-900 dark:text-white">HaulHub</span>
        </div>

        <div className="w-full max-w-sm mx-auto">
          {/* Heading */}
          <h1 className="text-2xl font-bold text-navy-900 dark:text-white">Welcome back</h1>
          <p className="mt-2 text-sm text-navy-500 dark:text-navy-400">
            Don&apos;t have an account?{' '}
            <Link
              to="/register"
              className="font-medium text-brand-600 hover:text-brand-500 transition-all duration-150 cursor-pointer"
            >
              Sign up for free &rarr;
            </Link>
          </p>

          <form
            onSubmit={handleSubmit((data) => loginMutation.mutate(data))}
            className="mt-8 space-y-4"
          >
            <div>
              <label className="label">Email</label>
              <input
                {...register('email', { required: 'Email is required' })}
                type="email"
                className="input"
                placeholder="you@example.com"
              />
              {errors.email && (
                <p className="mt-1 text-xs text-red-600">{errors.email.message}</p>
              )}
            </div>

            <div>
              <label className="label">Password</label>
              <input
                {...register('password', { required: 'Password is required' })}
                type="password"
                className="input"
                placeholder="••••••••"
              />
              {errors.password && (
                <p className="mt-1 text-xs text-red-600">{errors.password.message}</p>
              )}
            </div>

            {loginMutation.isError && (
              <p className="text-sm text-red-600 bg-red-50 dark:bg-red-900/20 dark:text-red-400 rounded-xl p-3 border border-red-100 dark:border-red-800/50">
                {(loginMutation.error as any)?.response?.data?.non_field_errors?.[0] ||
                  'Invalid email or password.'}
              </p>
            )}

            <button
              type="submit"
              disabled={loginMutation.isPending}
              className="btn-primary w-full mt-2 cursor-pointer transition-all duration-150"
            >
              {loginMutation.isPending ? 'Signing in...' : 'Sign in'}
            </button>
          </form>

          {/* Divider */}
          <div className="mt-6 relative flex items-center gap-3">
            <div className="w-full border-t border-navy-200 dark:border-navy-600" />
            <span className="px-3 bg-white dark:bg-navy-800 text-navy-400 text-sm shrink-0">
              Or continue with
            </span>
            <div className="w-full border-t border-navy-200 dark:border-navy-600" />
          </div>

          <div className="mt-4 flex justify-center">
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={() => setGoogleError('Google sign-in failed.')}
              useOneTap={false}
            />
          </div>
          {googleError && (
            <p className="mt-2 text-sm text-red-600 text-center">{googleError}</p>
          )}
        </div>
      </div>
    </div>
  )
}
