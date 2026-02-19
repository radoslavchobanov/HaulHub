import { useParams, useNavigate, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { jobsApi } from '../../api/jobs'
import { useAuthStore } from '../../stores/authStore'
import ChatWindow from '../../components/chat/ChatWindow'
import StarRating from '../../components/ui/StarRating'
import { PageLoader } from '../../components/ui/LoadingSpinner'

export default function NegotiationChat() {
  const { appId } = useParams<{ appId: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { user } = useAuthStore()
  const isClient = user?.user_type === 'client'

  const { data: application, isLoading } = useQuery({
    queryKey: ['application', appId],
    queryFn: () => jobsApi.getApplication(appId!).then((r) => r.data),
    enabled: !!appId,
  })

  const hire = useMutation({
    mutationFn: () => jobsApi.hire(appId!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['job', application?.job.id] })
      queryClient.invalidateQueries({ queryKey: ['job-applications', application?.job.id] })
      queryClient.invalidateQueries({ queryKey: ['wallet'] })
      navigate(`/jobs/${application?.job.id}`)
    },
  })

  if (isLoading) return <PageLoader />
  if (!application) return <p className="text-center text-navy-500 dark:text-navy-400">Application not found.</p>

  const hauler = application.hauler
  const job = application.job
  const backTo = isClient ? `/jobs/${job.id}` : '/applications'

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <button
          onClick={() => navigate(backTo)}
          className="text-sm text-brand-600 hover:text-brand-700 mb-2 flex items-center gap-1.5 transition-colors cursor-pointer"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
          </svg>
          {isClient ? 'Back to Job' : 'Back to Applications'}
        </button>
        <h1 className="text-2xl font-bold text-navy-900 dark:text-white">{job.title}</h1>
        <p className="text-navy-500 dark:text-navy-400 mt-1 text-sm">
          Negotiating with {hauler.full_name}
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 h-[500px]">
          {application.chat_room_id ? (
            <ChatWindow roomId={application.chat_room_id} />
          ) : (
            <div className="card h-full flex items-center justify-center">
              <p className="text-navy-400 dark:text-navy-500">Chat not available</p>
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className="card">
            <h3 className="font-semibold text-navy-900 dark:text-white mb-3">
              {isClient ? 'Hauler' : 'Job Details'}
            </h3>
            {isClient ? (
              <Link to={`/haulers/${hauler.id}`} className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                <div className="w-10 h-10 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center font-bold shrink-0">
                  {hauler.first_name[0]}{hauler.last_name[0]}
                </div>
                <div>
                  <p className="font-medium text-navy-900 dark:text-white">{hauler.full_name}</p>
                  {hauler.hauler_profile && (
                    <div className="flex items-center gap-1 mt-0.5">
                      <StarRating rating={parseFloat(hauler.hauler_profile.rating_avg)} size="sm" />
                      <span className="text-xs text-navy-500 dark:text-navy-400">({hauler.hauler_profile.review_count})</span>
                    </div>
                  )}
                </div>
              </Link>
            ) : (
              <div className="space-y-2 text-sm">
                <p className="font-medium text-navy-900 dark:text-white">{job.title}</p>
                <p className="text-navy-500 dark:text-navy-400">{job.city}, {job.country}</p>
                <p className="text-brand-700 font-semibold">${job.budget}</p>
              </div>
            )}
          </div>

          {isClient && application.status === 'negotiating' && (
            <div className="card bg-amber-50 border-amber-200 dark:bg-amber-900/20 dark:border-amber-700">
              <p className="text-sm text-amber-800 dark:text-amber-300 mb-3">
                Happy with the details? Hire this hauler to lock in the job and start escrow.
              </p>
              <button
                onClick={() => hire.mutate()}
                disabled={hire.isPending}
                className="btn-primary w-full"
              >
                {hire.isPending ? 'Processing...' : `Hire for $${job.budget}`}
              </button>
              {hire.isError && (
                <p className="mt-2 text-xs text-red-600">
                  {(hire.error as any)?.response?.data?.error || 'Failed to hire. Check your wallet balance.'}
                </p>
              )}
            </div>
          )}

          {isClient && application.status === 'negotiating' && (
            <p className="text-xs text-navy-400 dark:text-navy-500 text-center">
              Funds will be held in escrow until you mark the job complete.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
