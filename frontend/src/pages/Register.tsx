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
    label: 'Hire Haulers',
    sublabel: 'Post jobs & get help',
  },
  hauler: {
    icon: HaulerTruckIcon,
    label: 'Work as a Hauler',
    sublabel: 'Find jobs & earn',
  },
} as const

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
      <div className="flex-1 flex flex-col justify-center px-6 sm:px-12 py-12 bg-white dark:bg-navy-800 overflow-y-auto">
        {/* Mobile-only logo */}
        <div className="flex lg:hidden items-center gap-2 mb-8">
          <div className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center">
            <TruckIcon className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold text-navy-900 dark:text-white">HaulHub</span>
        </div>

        <div className="w-full max-w-sm mx-auto">
          {/* Heading */}
          <h1 className="text-2xl font-bold text-navy-900 dark:text-white">Create your account</h1>
          <p className="mt-2 text-sm text-navy-500 dark:text-navy-400">
            Already have one?{' '}
            <Link
              to="/login"
              className="font-medium text-brand-600 hover:text-brand-500 transition-all duration-150 cursor-pointer"
            >
              Sign in &rarr;
            </Link>
          </p>

          {/* Account type selection */}
          <div className="mt-8 mb-6">
            <p className="label mb-2">I want to...</p>
            <div className="grid grid-cols-2 gap-3">
              {(['client', 'hauler'] as const).map((type) => {
                const { icon: Icon, label, sublabel } = typeConfig[type]
                const selected = userType === type
                return (
                  <label
                    key={type}
                    className={`flex flex-col items-center p-4 rounded-xl border-2 cursor-pointer transition-all duration-150 ${
                      selected
                        ? 'border-brand-600 bg-brand-50 dark:bg-brand-900/20 text-navy-900 dark:text-white'
                        : 'border-navy-200 dark:border-navy-600 hover:border-navy-300 dark:hover:border-navy-500 text-navy-700 dark:text-navy-300'
                    }`}
                  >
                    <input
                      {...register('user_type')}
                      type="radio"
                      value={type}
                      className="sr-only"
                    />
                    <Icon className={`w-6 h-6 mb-1.5 ${selected ? 'text-brand-600' : 'text-navy-400 dark:text-navy-500'}`} />
                    <span className="font-medium text-sm">{label}</span>
                    <span className={`text-xs text-center mt-0.5 ${selected ? 'text-brand-600/80 dark:text-brand-400/80' : 'text-navy-400 dark:text-navy-500'}`}>
                      {sublabel}
                    </span>
                  </label>
                )
              })}
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
                {errors.first_name && (
                  <p className="mt-1 text-xs text-red-600">{errors.first_name.message}</p>
                )}
              </div>
              <div>
                <label className="label">Last name</label>
                <input
                  {...register('last_name', { required: 'Required' })}
                  className="input"
                  placeholder="Doe"
                />
                {errors.last_name && (
                  <p className="mt-1 text-xs text-red-600">{errors.last_name.message}</p>
                )}
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
              {errors.email && (
                <p className="mt-1 text-xs text-red-600">{errors.email.message}</p>
              )}
            </div>

            <div>
              <label className="label">Password</label>
              <input
                {...register('password', {
                  required: 'Required',
                  minLength: { value: 8, message: 'Minimum 8 characters' },
                })}
                type="password"
                className="input"
                placeholder="At least 8 characters"
              />
              {errors.password && (
                <p className="mt-1 text-xs text-red-600">{errors.password.message}</p>
              )}
            </div>

            <div>
              <label className="label">Phone (optional)</label>
              <input
                {...register('phone')}
                type="tel"
                className="input"
                placeholder="+1 (555) 000-0000"
              />
            </div>

            {mutation.isError && (
              <p className="text-sm text-red-600 bg-red-50 dark:bg-red-900/20 dark:text-red-400 rounded-xl p-3 border border-red-100 dark:border-red-800/50">
                {(mutation.error as any)?.response?.data?.email?.[0] ||
                  (mutation.error as any)?.response?.data?.password?.[0] ||
                  'Registration failed. Please try again.'}
              </p>
            )}

            <button
              type="submit"
              disabled={mutation.isPending}
              className="btn-primary w-full cursor-pointer transition-all duration-150"
            >
              {mutation.isPending ? 'Creating account...' : 'Create account'}
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
              onError={() => setGoogleError('Google sign-up failed.')}
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
