import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { jobsApi } from '../../api/jobs'
import JobCard from '../../components/jobs/JobCard'
import { PageLoader } from '../../components/ui/LoadingSpinner'

export default function Dashboard() {
  const { data: jobs, isLoading } = useQuery({
    queryKey: ['my-jobs'],
    queryFn: () => jobsApi.mine().then((r) => r.data),
  })

  if (isLoading) return <PageLoader />

  const active = jobs?.filter((j) => ['open', 'assigned'].includes(j.status)) || []
  const past = jobs?.filter((j) => ['completed', 'cancelled'].includes(j.status)) || []

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Jobs</h1>
          <p className="text-gray-600 mt-1">Manage your posted jobs</p>
        </div>
        <Link to="/jobs/new" className="btn-primary">
          + Post a Job
        </Link>
      </div>

      {jobs?.length === 0 && (
        <div className="card text-center py-16">
          <p className="text-4xl mb-4">📋</p>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No jobs posted yet</h3>
          <p className="text-gray-600 mb-6">Post your first job and get help from trusted Haulers.</p>
          <Link to="/jobs/new" className="btn-primary">Post your first job</Link>
        </div>
      )}

      {active.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Active Jobs</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {active.map((job) => <JobCard key={job.id} job={job} linkTo={`/jobs/${job.id}`} />)}
          </div>
        </section>
      )}

      {past.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Past Jobs</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {past.map((job) => <JobCard key={job.id} job={job} linkTo={`/jobs/${job.id}`} />)}
          </div>
        </section>
      )}
    </div>
  )
}
