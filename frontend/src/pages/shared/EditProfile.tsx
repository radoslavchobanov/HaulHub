import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { authApi } from '../../api/auth'
import { useAuthStore } from '../../stores/authStore'
import { useNavigate } from 'react-router-dom'

const SKILLS = [
  'Furniture Moving', 'Junk Removal', 'Appliance Install', 'IKEA Assembly',
  'Heavy Lifting', 'Packing', 'Storage', 'Piano Moving', 'Driving', 'Other'
]

interface ProfileForm {
  bio: string
  skills: string[]
}

export default function EditProfile() {
  const { user, setUser } = useAuthStore()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const profile = user?.hauler_profile
  const [selectedSkills, setSelectedSkills] = useState<string[]>(profile?.skills || [])

  const { register, handleSubmit, setValue } = useForm<ProfileForm>({
    defaultValues: {
      bio: profile?.bio || '',
    },
  })

  const mutation = useMutation({
    mutationFn: (data: ProfileForm) =>
      authApi.updateProfile({ ...data, skills: selectedSkills }),
    onSuccess: async () => {
      const { data } = await authApi.me()
      setUser(data)
      queryClient.invalidateQueries({ queryKey: ['me'] })
      navigate('/board')
    },
  })

  const toggleSkill = (skill: string) => {
    setSelectedSkills((prev) =>
      prev.includes(skill) ? prev.filter((s) => s !== skill) : [...prev, skill]
    )
  }

  if (user?.user_type !== 'hauler') {
    navigate('/')
    return null
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Edit Profile</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">A great profile helps you get hired faster.</p>
      </div>

      <div className="card">
        <form onSubmit={handleSubmit((data) => mutation.mutate(data))} className="space-y-6">
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
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  {skill}
                </button>
              ))}
            </div>
          </div>

          {mutation.isError && (
            <p className="text-sm text-red-600 bg-red-50 dark:bg-red-900/20 dark:text-red-400 rounded-lg p-3">
              Failed to update profile. Please try again.
            </p>
          )}

          <div className="flex gap-3">
            <button type="submit" disabled={mutation.isPending} className="btn-primary flex-1">
              {mutation.isPending ? 'Saving...' : 'Save Profile'}
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
