import { useParams, useNavigate, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { jobsApi } from '../../api/jobs'
import { bookingsApi } from '../../api/bookings'
import Badge, { jobStatusBadge } from '../../components/ui/Badge'
import ApplicationCard from '../../components/jobs/ApplicationCard'
import { PageLoader } from '../../components/ui/LoadingSpinner'
import { format } from 'date-fns'

export default function ClientJobDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const { data: job, isLoading } = useQuery({
    queryKey: ['job', id],
    queryFn: () => jobsApi.get(id!).then((r) => r.data),
  })

  const { data: applications } = useQuery({
    queryKey: ['job-applications', id],
    queryFn: () => jobsApi.getApplications(id!).then((r) => r.data),
    enabled: !!id,
  })

  const cancelMutation = useMutation({
    mutationFn: () => jobsApi.cancel(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['job', id] })
      queryClient.invalidateQueries({ queryKey: ['my-jobs'] })
    },
  })

  if (isLoading) return <PageLoader />
  if (!job) return <p className="text-center text-gray-500 dark:text-gray-400">Job not found.</p>

  const booking = job.status === 'assigned' || job.status === 'completed'
  const acceptedApp = applications?.find((a) => a.status === 'accepted')

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <button onClick={() => navigate('/dashboard')} className="text-sm text-brand-600 hover:text-brand-800 mb-2 flex items-center gap-1">
            ← Back to Dashboard
          </button>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{job.title}</h1>
          <div className="flex items-center gap-3 mt-2">
            <Badge variant={jobStatusBadge(job.status)}>{job.status_display}</Badge>
            <span className="text-sm text-gray-500 dark:text-gray-400">Posted {format(new Date(job.created_at), 'MMM d, yyyy')}</span>
          </div>
        </div>
        <div className="text-right">
          <p className="text-3xl font-bold text-brand-700">${job.budget}</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="card">
            <h2 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">Job Details</h2>
            <p className="text-gray-700 dark:text-gray-300 whitespace-pre-line">{job.description}</p>
            <div className="grid sm:grid-cols-2 gap-4 mt-4 pt-4 border-t border-gray-100 dark:border-gray-700 text-sm">
              <div>
                <span className="text-gray-500 dark:text-gray-400">Category</span>
                <p className="font-medium dark:text-gray-200 mt-0.5">{job.category_display}</p>
              </div>
              <div>
                <span className="text-gray-500 dark:text-gray-400">Scheduled</span>
                <p className="font-medium dark:text-gray-200 mt-0.5">{format(new Date(job.scheduled_date), 'PPP p')}</p>
              </div>
              <div className="sm:col-span-2">
                <span className="text-gray-500 dark:text-gray-400">Location</span>
                <p className="font-medium dark:text-gray-200 mt-0.5">{job.location_address}</p>
              </div>
            </div>
          </div>

          {booking && acceptedApp && (
            <div className="card bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-green-900 dark:text-green-400">Hauler assigned: {acceptedApp.hauler.full_name}</h3>
                  <p className="text-sm text-green-700 dark:text-green-500 mt-0.5">Escrow is active — funds will be released on completion.</p>
                </div>
                {job.status === 'assigned' && (
                  <Link
                    to={`/bookings/${job.booking?.id}`}
                    className="btn-primary bg-green-700 hover:bg-green-800 text-sm shrink-0"
                  >
                    Open Chat & Booking
                  </Link>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="space-y-4">
          {job.status === 'open' && (
            <div className="card">
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                {job.application_count} application{job.application_count !== 1 ? 's' : ''}
              </p>
              <button
                onClick={() => cancelMutation.mutate()}
                disabled={cancelMutation.isPending}
                className="btn-danger w-full text-sm"
              >
                {cancelMutation.isPending ? 'Cancelling...' : 'Cancel Job'}
              </button>
            </div>
          )}
        </div>
      </div>

      {applications && applications.length > 0 && job.status === 'open' && (
        <section>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Applications ({applications.length})
          </h2>
          <div className="space-y-4">
            {applications.map((app) => (
              <ApplicationCard key={app.id} application={app} jobId={id!} canAct={job.status === 'open'} />
            ))}
          </div>
        </section>
      )}

      {applications?.length === 0 && job.status === 'open' && (
        <div className="card text-center py-12">
          <p className="text-3xl mb-3">⏳</p>
          <p className="text-gray-600 dark:text-gray-400">No applications yet. Haulers will apply soon!</p>
        </div>
      )}
    </div>
  )
}
