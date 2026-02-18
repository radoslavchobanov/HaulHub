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
        <h1 className="text-2xl font-bold text-gray-900">My Applications</h1>
        <p className="text-gray-600 mt-1">Track your job applications</p>
      </div>

      {applications?.length === 0 && (
        <div className="card text-center py-16">
          <p className="text-4xl mb-4">📝</p>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No applications yet</h3>
          <p className="text-gray-600 mb-6">Browse the job board and apply to jobs that interest you.</p>
          <Link to="/board" className="btn-primary">Browse Jobs</Link>
        </div>
      )}

      {accepted.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Accepted ({accepted.length})</h2>
          <div className="space-y-3">
            {accepted.map((app) => (
              <ApplicationRow key={app.id} application={app} />
            ))}
          </div>
        </section>
      )}

      {pending.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Pending ({pending.length})</h2>
          <div className="space-y-3">
            {pending.map((app) => (
              <ApplicationRow key={app.id} application={app} />
            ))}
          </div>
        </section>
      )}

      {past.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Past ({past.length})</h2>
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
  return (
    <Link to={`/board/${job.id}`} className="card block hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between gap-4">
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-gray-900 truncate">{job.title}</p>
          <p className="text-sm text-gray-500 mt-0.5">
            ${job.budget} · {format(new Date(job.scheduled_date), 'MMM d, yyyy')}
          </p>
          <p className="text-sm text-gray-600 mt-1 line-clamp-1">{application.proposal_message}</p>
        </div>
        <Badge variant={applicationStatusBadge(application.status)}>{application.status}</Badge>
      </div>
      {application.status === 'accepted' && (
        <p className="mt-2 text-sm text-green-700 font-medium">→ View booking and chat</p>
      )}
    </Link>
  )
}
