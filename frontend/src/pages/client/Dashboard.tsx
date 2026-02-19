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
          <h1 className="text-2xl font-bold text-navy-900 dark:text-white">My Jobs</h1>
          <p className="text-navy-600 dark:text-navy-400 mt-1">Manage your posted jobs</p>
        </div>
        <Link to="/jobs/new" className="btn-primary">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Post a Job
        </Link>
      </div>

      {jobs?.length === 0 && (
        <div className="card text-center py-16">
          <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-navy-100 dark:bg-navy-700 flex items-center justify-center">
            <svg className="w-7 h-7 text-navy-400 dark:text-navy-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-navy-900 dark:text-white mb-2">No jobs posted yet</h3>
          <p className="text-navy-600 dark:text-navy-400 mb-6">Post your first job and get help from trusted Haulers.</p>
          <Link to="/jobs/new" className="btn-primary">Post your first job</Link>
        </div>
      )}

      {active.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold text-navy-900 dark:text-white mb-4">Active Jobs</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {active.map((job) => <JobCard key={job.id} job={job} linkTo={`/jobs/${job.id}`} />)}
          </div>
        </section>
      )}

      {past.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold text-navy-900 dark:text-white mb-4">Past Jobs</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {past.map((job) => <JobCard key={job.id} job={job} linkTo={`/jobs/${job.id}`} />)}
          </div>
        </section>
      )}
    </div>
  )
}
