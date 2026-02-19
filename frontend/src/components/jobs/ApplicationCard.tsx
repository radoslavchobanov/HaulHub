import { useMutation, useQueryClient } from '@tanstack/react-query'
import { jobsApi } from '../../api/jobs'
import Badge, { applicationStatusBadge } from '../ui/Badge'
import StarRating from '../ui/StarRating'
import { Link } from 'react-router-dom'
import type { JobApplication } from '../../types'
import { format } from 'date-fns'

interface ApplicationCardProps {
  application: JobApplication
  jobId: string
  canAct?: boolean
}

export default function ApplicationCard({ application, jobId, canAct = false }: ApplicationCardProps) {
  const queryClient = useQueryClient()
  const hauler = application.hauler

  const accept = useMutation({
    mutationFn: () => jobsApi.acceptApplication(application.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['job', jobId] })
      queryClient.invalidateQueries({ queryKey: ['job-applications', jobId] })
      queryClient.invalidateQueries({ queryKey: ['wallet'] })
    },
  })

  const reject = useMutation({
    mutationFn: () => jobsApi.rejectApplication(application.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['job-applications', jobId] })
    },
  })

  const isLoading = accept.isPending || reject.isPending

  return (
    <div className="card">
      <div className="flex items-start gap-4">
        <div className="w-10 h-10 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center font-bold shrink-0">
          {hauler.first_name[0]}{hauler.last_name[0]}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <Link
                to={`/haulers/${hauler.id}`}
                className="font-semibold text-navy-900 dark:text-white hover:text-brand-600 transition-colors cursor-pointer"
              >
                {hauler.full_name}
              </Link>
              {hauler.hauler_profile && (
                <div className="flex items-center gap-2 mt-0.5">
                  <StarRating rating={parseFloat(hauler.hauler_profile.rating_avg)} size="sm" />
                  <span className="text-xs text-navy-500 dark:text-navy-400">
                    ({hauler.hauler_profile.review_count} reviews)
                  </span>
                </div>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={applicationStatusBadge(application.status)}>
                {application.status}
              </Badge>
              <span className="text-xs text-navy-400 dark:text-navy-500">
                {format(new Date(application.created_at), 'MMM d')}
              </span>
            </div>
          </div>

          <p className="text-sm text-navy-700 dark:text-navy-300 mt-2">{application.proposal_message}</p>

          {canAct && application.status === 'pending' && (
            <div className="flex gap-2 mt-3">
              <button
                onClick={() => accept.mutate()}
                disabled={isLoading}
                className="btn-primary text-sm"
              >
                {accept.isPending ? 'Accepting...' : 'Accept'}
              </button>
              <button
                onClick={() => reject.mutate()}
                disabled={isLoading}
                className="btn-secondary text-sm"
              >
                {reject.isPending ? 'Rejecting...' : 'Decline'}
              </button>
            </div>
          )}

          {accept.isError && (
            <p className="text-sm text-red-600 mt-2">
              {(accept.error as any)?.response?.data?.error || 'Failed to accept. Check your wallet balance.'}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
