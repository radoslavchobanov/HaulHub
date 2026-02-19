import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { jobsApi } from '../../api/jobs'
import Badge, { applicationStatusBadge } from '../../components/ui/Badge'
import { PageLoader } from '../../components/ui/LoadingSpinner'
import { format } from 'date-fns'

export default function Applications() {
  const { data: applications, isLoading } = useQuery({
    queryKey: ['my-applications'],
    queryFn: () => jobsApi.myApplications().then((r) => r.data),
  })

  if (isLoading) return <PageLoader />

  const pending = applications?.filter((a) => a.status === 'pending') || []
  const accepted = applications?.filter((a) => a.status === 'accepted') || []
  const past = applications?.filter((a) => a.status === 'rejected') || []

  return (
    <div className="space-y-8 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-navy-900 dark:text-white">My Applications</h1>
        <p className="text-navy-600 dark:text-navy-400 mt-1">Track your job applications</p>
      </div>

      {applications?.length === 0 && (
        <div className="card text-center py-16">
          <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-navy-100 dark:bg-navy-700 flex items-center justify-center">
            <svg className="w-7 h-7 text-navy-400 dark:text-navy-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-navy-900 dark:text-white mb-2">No applications yet</h3>
          <p className="text-navy-600 dark:text-navy-400 mb-6">Browse the job board and apply to jobs that interest you.</p>
          <Link to="/board" className="btn-primary">Browse Jobs</Link>
        </div>
      )}

      {accepted.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold text-navy-900 dark:text-white mb-4">Accepted ({accepted.length})</h2>
          <div className="space-y-3">
            {accepted.map((app) => (
              <ApplicationRow key={app.id} application={app} />
            ))}
          </div>
        </section>
      )}

      {pending.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold text-navy-900 dark:text-white mb-4">Pending ({pending.length})</h2>
          <div className="space-y-3">
            {pending.map((app) => (
              <ApplicationRow key={app.id} application={app} />
            ))}
          </div>
        </section>
      )}

      {past.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold text-navy-900 dark:text-white mb-4">Past ({past.length})</h2>
          <div className="space-y-3 opacity-70">
            {past.map((app) => (
              <ApplicationRow key={app.id} application={app} />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}

function ApplicationRow({ application }: { application: any }) {
  const job = application.job
  const to = application.status === 'negotiating'
    ? `/negotiate/${application.id}`
    : `/board/${job.id}`
  return (
    <Link to={to} className="card block hover:shadow-md hover:border-navy-200 dark:hover:border-navy-600 transition-all duration-150">
      <div className="flex items-center justify-between gap-4">
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-navy-900 dark:text-white truncate">{job.title}</p>
          <p className="text-sm text-navy-500 dark:text-navy-400 mt-0.5">
            ${job.budget} · {format(new Date(job.scheduled_date), 'MMM d, yyyy')}
          </p>
          <p className="text-sm text-navy-600 dark:text-navy-400 mt-1 line-clamp-1">{application.proposal_message}</p>
        </div>
        <Badge variant={applicationStatusBadge(application.status)}>{application.status}</Badge>
      </div>
      {application.status === 'negotiating' && (
        <p className="mt-2 text-sm text-amber-700 dark:text-amber-400 font-medium flex items-center gap-1.5">
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" /></svg>
          Chat in progress — tap to continue
        </p>
      )}
      {application.status === 'accepted' && (
        <p className="mt-2 text-sm text-green-700 dark:text-green-400 font-medium flex items-center gap-1.5">
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" /></svg>
          View booking and chat
        </p>
      )}
    </Link>
  )
}
