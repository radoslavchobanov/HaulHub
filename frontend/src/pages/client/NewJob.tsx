import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { jobsApi } from '../../api/jobs'
import { useAuthStore } from '../../stores/authStore'
import LocationPicker from '../../components/ui/LocationPicker'

const CATEGORIES = [
  { value: 'furniture_moving', label: 'Furniture Moving' },
  { value: 'junk_removal', label: 'Junk Removal' },
  { value: 'appliance', label: 'Appliance Install/Removal' },
  { value: 'assembly', label: 'Assembly (IKEA etc.)' },
  { value: 'heavy_lifting', label: 'Heavy Lifting / Loading' },
  { value: 'packing', label: 'Packing / Unpacking' },
  { value: 'storage', label: 'Storage Help' },
  { value: 'other', label: 'Other' },
]

interface JobForm {
  title: string
  description: string
  category: string
  budget: string
  scheduled_date: string
}

export default function NewJob() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { user } = useAuthStore()

  const { register, handleSubmit, formState: { errors } } = useForm<JobForm>()

  const [location, setLocation] = useState({
    country: user?.country ?? '',
    city: user?.city ?? '',
    neighborhood: '',
  })
  const [locationError, setLocationError] = useState('')

  const mutation = useMutation({
    mutationFn: (data: JobForm) =>
      jobsApi.create({
        ...data,
        country: location.country,
        city: location.city,
        neighborhood: location.neighborhood,
      }),
    onSuccess: ({ data }) => {
      queryClient.invalidateQueries({ queryKey: ['my-jobs'] })
      navigate(`/jobs/${data.id}`)
    },
  })

  function onSubmit(data: JobForm) {
    if (!location.country || !location.city) {
      setLocationError('Please select a country and city.')
      return
    }
    setLocationError('')
    mutation.mutate(data)
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-navy-900 dark:text-white">Post a New Job</h1>
        <p className="text-navy-600 dark:text-navy-400 mt-1">Describe your job and Haulers will apply to help you.</p>
      </div>

      <div className="card">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div>
            <label className="label">Job Title</label>
            <input
              {...register('title', { required: 'Title is required' })}
              className="input"
              placeholder="e.g. Help moving 3-bedroom apartment"
            />
            {errors.title && <p className="mt-1 text-xs text-red-600">{errors.title.message}</p>}
          </div>

          <div>
            <label className="label">Category</label>
            <select {...register('category', { required: 'Category is required' })} className="input">
              <option value="">Select a category...</option>
              {CATEGORIES.map(({ value, label }) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
            {errors.category && <p className="mt-1 text-xs text-red-600">{errors.category.message}</p>}
          </div>

          <div>
            <label className="label">Description</label>
            <textarea
              {...register('description', { required: 'Description is required', minLength: { value: 20, message: 'Please provide at least 20 characters' } })}
              className="input"
              rows={4}
              placeholder="Describe what needs to be done, how many items, any special instructions..."
            />
            {errors.description && <p className="mt-1 text-xs text-red-600">{errors.description.message}</p>}
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Budget (USD)</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-navy-500 dark:text-navy-400">$</span>
                <input
                  {...register('budget', {
                    required: 'Budget is required',
                    min: { value: 1, message: 'Minimum $1' },
                  })}
                  type="number"
                  step="0.01"
                  className="input pl-7"
                  placeholder="150.00"
                />
              </div>
              {errors.budget && <p className="mt-1 text-xs text-red-600">{errors.budget.message}</p>}
            </div>

            <div>
              <label className="label">Scheduled Date & Time</label>
              <input
                {...register('scheduled_date', { required: 'Date is required' })}
                type="datetime-local"
                className="input"
              />
              {errors.scheduled_date && <p className="mt-1 text-xs text-red-600">{errors.scheduled_date.message}</p>}
            </div>
          </div>

          <div className="pt-1">
            <LocationPicker
              value={location}
              onChange={(val) => setLocation({ country: val.country, city: val.city, neighborhood: val.neighborhood ?? '' })}
              showNeighborhood
              required
            />
            {locationError && <p className="mt-1 text-xs text-red-600">{locationError}</p>}
          </div>

          {mutation.isError && (
            <p className="text-sm text-red-600 bg-red-50 dark:bg-red-900/20 dark:text-red-400 rounded-lg p-3">
              {(mutation.error as any)?.response?.data?.detail || 'Failed to post job. Please try again.'}
            </p>
          )}

          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={mutation.isPending} className="btn-primary flex-1">
              {mutation.isPending ? 'Posting...' : 'Post Job'}
            </button>
            <button type="button" onClick={() => navigate('/dashboard')} className="btn-secondary">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
