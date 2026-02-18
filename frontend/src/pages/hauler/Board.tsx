import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { jobsApi } from '../../api/jobs'
import JobCard from '../../components/jobs/JobCard'
import { PageLoader } from '../../components/ui/LoadingSpinner'

const CATEGORIES = [
  { value: '', label: 'All Categories' },
  { value: 'furniture_moving', label: 'Furniture Moving' },
  { value: 'junk_removal', label: 'Junk Removal' },
  { value: 'appliance', label: 'Appliance' },
  { value: 'assembly', label: 'Assembly' },
  { value: 'heavy_lifting', label: 'Heavy Lifting' },
  { value: 'packing', label: 'Packing' },
  { value: 'storage', label: 'Storage' },
  { value: 'other', label: 'Other' },
]

export default function Board() {
  const [category, setCategory] = useState('')

  const { data: jobs, isLoading } = useQuery({
    queryKey: ['jobs', category],
    queryFn: () => jobsApi.list(category || undefined).then((r) => r.data),
    refetchInterval: 60000,
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Job Board</h1>
        <p className="text-gray-600 mt-1">Browse open jobs and apply to the ones that fit you.</p>
      </div>

      {/* Category filter */}
      <div className="flex gap-2 flex-wrap">
        {CATEGORIES.map(({ value, label }) => (
          <button
            key={value}
            onClick={() => setCategory(value)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
              category === value
                ? 'bg-brand-600 text-white'
                : 'bg-white text-gray-700 border border-gray-300 hover:border-brand-400'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {isLoading && <PageLoader />}

      {!isLoading && jobs?.length === 0 && (
        <div className="card text-center py-16">
          <p className="text-4xl mb-4">🔍</p>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No open jobs right now</h3>
          <p className="text-gray-600">Check back soon — new jobs are posted regularly.</p>
        </div>
      )}

      {jobs && jobs.length > 0 && (
        <div>
          <p className="text-sm text-gray-500 mb-4">{jobs.length} open job{jobs.length !== 1 ? 's' : ''}</p>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {jobs.map((job) => <JobCard key={job.id} job={job} />)}
          </div>
        </div>
      )}
    </div>
  )
}
