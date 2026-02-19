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
        <h1 className="text-2xl font-bold text-navy-900 dark:text-white">Job Board</h1>
        <p className="text-navy-600 dark:text-navy-400 mt-1">Browse open jobs and apply to the ones that fit you.</p>
      </div>

      {/* Category filter */}
      <div className="flex gap-2 flex-wrap">
        {CATEGORIES.map(({ value, label }) => (
          <button
            key={value}
            onClick={() => setCategory(value)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-150 cursor-pointer ${
              category === value
                ? 'bg-brand-600 text-white'
                : 'bg-white text-navy-700 border border-navy-200 hover:border-brand-400 dark:bg-navy-800 dark:text-navy-200 dark:border-navy-600 dark:hover:border-brand-400'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {isLoading && <PageLoader />}

      {!isLoading && jobs?.length === 0 && (
        <div className="card text-center py-16">
          <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-navy-100 dark:bg-navy-700 flex items-center justify-center">
            <svg className="w-7 h-7 text-navy-400 dark:text-navy-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-navy-900 dark:text-white mb-2">No open jobs right now</h3>
          <p className="text-navy-600 dark:text-navy-400">Check back soon — new jobs are posted regularly.</p>
        </div>
      )}

      {jobs && jobs.length > 0 && (
        <div>
          <p className="text-sm text-navy-500 dark:text-navy-400 mb-4">{jobs.length} open job{jobs.length !== 1 ? 's' : ''}</p>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {jobs.map((job) => <JobCard key={job.id} job={job} />)}
          </div>
        </div>
      )}
    </div>
  )
}
