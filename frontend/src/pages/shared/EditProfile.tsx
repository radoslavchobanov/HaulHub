import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { authApi } from '../../api/auth'
import { useAuthStore } from '../../stores/authStore'
import { useNavigate } from 'react-router-dom'
import LocationPicker from '../../components/ui/LocationPicker'

const SKILLS = [
  'Furniture Moving', 'Junk Removal', 'Appliance Install', 'IKEA Assembly',
  'Heavy Lifting', 'Packing', 'Storage', 'Piano Moving', 'Driving', 'Other'
]

interface ProfileForm {
  bio: string
}

export default function EditProfile() {
  const { user, setUser } = useAuthStore()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const isHauler = user?.user_type === 'hauler'

  const profile = user?.hauler_profile
  const [selectedSkills, setSelectedSkills] = useState<string[]>(profile?.skills || [])
  const [location, setLocation] = useState({
    country: user?.country ?? '',
    city: user?.city ?? '',
  })

  const { register, handleSubmit } = useForm<ProfileForm>({
    defaultValues: { bio: profile?.bio || '' },
  })

  const userMutation = useMutation({
    mutationFn: () => authApi.updateUser({ country: location.country, city: location.city }),
  })

  const profileMutation = useMutation({
    mutationFn: (bio: string) =>
      authApi.updateProfile({ bio, skills: selectedSkills }),
  })

  async function onSubmit(data: ProfileForm) {
    await userMutation.mutateAsync()
    if (isHauler) {
      await profileMutation.mutateAsync(data.bio)
    }
    const { data: freshUser } = await authApi.me()
    setUser(freshUser)
    queryClient.invalidateQueries({ queryKey: ['me'] })
    navigate(isHauler ? '/board' : '/dashboard')
  }

  const toggleSkill = (skill: string) => {
    setSelectedSkills((prev) =>
      prev.includes(skill) ? prev.filter((s) => s !== skill) : [...prev, skill]
    )
  }

  const isPending = userMutation.isPending || profileMutation.isPending
  const isError = userMutation.isError || profileMutation.isError

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-navy-900 dark:text-white">
          {isHauler ? 'Edit Profile' : 'Account Settings'}
        </h1>
        <p className="text-navy-600 dark:text-navy-400 mt-1">
          {isHauler
            ? 'A great profile helps you get hired faster.'
            : 'Keep your location up to date so job forms pre-fill automatically.'}
        </p>
      </div>

      <div className="card">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Location — shown for all users */}
          <div>
            <h2 className="text-sm font-semibold text-navy-700 dark:text-navy-300 mb-4 uppercase tracking-wide">
              Default Location
            </h2>
            <LocationPicker value={location} onChange={setLocation} />
            <p className="mt-2 text-xs text-navy-400 dark:text-navy-500">
              This pre-fills the country and city when you post a new job.
            </p>
          </div>

          {/* Hauler-only sections */}
          {isHauler && (
            <>
              <div className="border-t border-navy-100 dark:border-navy-700 pt-6">
                <h2 className="text-sm font-semibold text-navy-700 dark:text-navy-300 mb-4 uppercase tracking-wide">
                  Hauler Profile
                </h2>
                <div className="space-y-6">
                  <div>
                    <label className="label">About You</label>
                    <textarea
                      {...register('bio')}
                      className="input"
                      rows={4}
                      placeholder="Tell clients about your experience, how long you've been doing this work, and what makes you reliable..."
                    />
                  </div>

                  <div>
                    <label className="label">Skills</label>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {SKILLS.map((skill) => (
                        <button
                          key={skill}
                          type="button"
                          onClick={() => toggleSkill(skill)}
                          className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors cursor-pointer ${
                            selectedSkills.includes(skill)
                              ? 'bg-brand-600 text-white'
                              : 'bg-navy-100 text-navy-700 hover:bg-navy-200 dark:bg-navy-700 dark:text-navy-200 dark:hover:bg-navy-600'
                          }`}
                        >
                          {skill}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          {isError && (
            <p className="text-sm text-red-600 bg-red-50 dark:bg-red-900/20 dark:text-red-400 rounded-lg p-3">
              Failed to save. Please try again.
            </p>
          )}

          <div className="flex gap-3">
            <button type="submit" disabled={isPending} className="btn-primary flex-1">
              {isPending ? 'Saving...' : 'Save'}
            </button>
            <button type="button" onClick={() => navigate(-1)} className="btn-secondary">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
