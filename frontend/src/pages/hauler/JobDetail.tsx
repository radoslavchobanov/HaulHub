import { useParams, useNavigate, Link } from 'react-router-dom'
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { jobsApi } from '../../api/jobs'
import Badge, { jobStatusBadge, applicationStatusBadge } from '../../components/ui/Badge'
import Modal from '../../components/ui/Modal'
import StarRating from '../../components/ui/StarRating'
import { PageLoader } from '../../components/ui/LoadingSpinner'
import { format } from 'date-fns'

export default function HaulerJobDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [showApplyModal, setShowApplyModal] = useState(false)
  const [proposal, setProposal] = useState('')

  const { data: job, isLoading } = useQuery({
    queryKey: ['job', id],
    queryFn: () => jobsApi.get(id!).then((r) => r.data),
  })

  const applyMutation = useMutation({
    mutationFn: () => jobsApi.apply(id!, proposal),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['job', id] })
      queryClient.invalidateQueries({ queryKey: ['my-applications'] })
      setShowApplyModal(false)
      setProposal('')
    },
  })

  if (isLoading) return <PageLoader />
  if (!job) return <p className="text-center text-navy-500 dark:text-navy-400">Job not found.</p>

  const myApp = job.my_application
  const alreadyApplied = !!myApp

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <button onClick={() => navigate('/board')} className="text-sm text-brand-600 hover:text-brand-700 mb-2 flex items-center gap-1.5 transition-colors cursor-pointer">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" /></svg>
          Back to Board
        </button>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-navy-900 dark:text-white">{job.title}</h1>
            <div className="flex items-center gap-3 mt-2">
              <Badge variant={jobStatusBadge(job.status)}>{job.status_display}</Badge>
              <span className="text-sm text-navy-500 dark:text-navy-400">{job.application_count} applicant{job.application_count !== 1 ? 's' : ''}</span>
            </div>
          </div>
          <div className="text-right shrink-0">
            <p className="text-3xl font-bold text-brand-700">${job.budget}</p>
            <p className="text-sm text-navy-500 dark:text-navy-400">fixed price</p>
          </div>
        </div>
      </div>

      <div className="card">
        <h2 className="font-semibold text-navy-900 dark:text-white mb-3">Job Description</h2>
        <p className="text-navy-700 dark:text-navy-300 whitespace-pre-line">{job.description}</p>

        <div className="grid sm:grid-cols-3 gap-4 mt-5 pt-5 border-t border-navy-100 dark:border-navy-700 text-sm">
          <div>
            <span className="text-navy-500 dark:text-navy-400">Category</span>
            <p className="font-medium dark:text-white mt-0.5">{job.category_display}</p>
          </div>
          <div>
            <span className="text-navy-500 dark:text-navy-400">Date</span>
            <p className="font-medium dark:text-white mt-0.5">{format(new Date(job.scheduled_date), 'PPP')}</p>
          </div>
          <div>
            <span className="text-navy-500 dark:text-navy-400">Time</span>
            <p className="font-medium dark:text-white mt-0.5">{format(new Date(job.scheduled_date), 'p')}</p>
          </div>
          <div className="sm:col-span-3">
            <span className="text-navy-500 dark:text-navy-400">Location</span>
            <p className="font-medium dark:text-white mt-0.5">{job.location_display}</p>
          </div>
        </div>
      </div>

      <div className="card">
        <h2 className="font-semibold text-navy-900 dark:text-white mb-3">Posted by</h2>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-navy-100 dark:bg-navy-700 text-navy-600 dark:text-navy-300 flex items-center justify-center font-bold">
            {job.client.first_name[0]}{job.client.last_name[0]}
          </div>
          <div>
            <p className="font-medium text-navy-900 dark:text-white">{job.client.full_name}</p>
            <p className="text-sm text-navy-500 dark:text-navy-400">Client since {format(new Date(job.client.created_at), 'yyyy')}</p>
          </div>
        </div>
      </div>

      {/* Apply section */}
      {job.status === 'open' && (
        <div className="card">
          {!alreadyApplied ? (
            <>
              <p className="text-sm text-navy-600 dark:text-navy-400 mb-4">
                This job pays <span className="font-semibold text-brand-700">${job.budget}</span>. Write a short proposal to stand out.
              </p>
              <button onClick={() => setShowApplyModal(true)} className="btn-primary w-full">
                Apply for this Job
              </button>
            </>
          ) : (
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-navy-900 dark:text-white">You applied to this job</p>
                <p className="text-sm text-navy-500 dark:text-navy-400 mt-0.5">"{myApp.proposal_message.slice(0, 80)}..."</p>
              </div>
              <Badge variant={applicationStatusBadge(myApp.status)}>{myApp.status}</Badge>
            </div>
          )}

          {myApp?.status === 'accepted' && (
            <div className="mt-4 pt-4 border-t border-navy-100 dark:border-navy-700">
              <Link to={`/bookings/${job.booking?.id}`} className="btn-primary w-full text-center block">
                Open Chat & Booking →
              </Link>
            </div>
          )}
        </div>
      )}

      <Modal isOpen={showApplyModal} onClose={() => setShowApplyModal(false)} title="Apply for this Job">
        <div className="space-y-4">
          <div>
            <label className="label">Your Proposal</label>
            <textarea
              value={proposal}
              onChange={(e) => setProposal(e.target.value)}
              className="input"
              rows={4}
              placeholder="Introduce yourself and explain why you're a great fit. Mention your experience with similar work..."
            />
          </div>
          {applyMutation.isError && (
            <p className="text-sm text-red-600">
              {(applyMutation.error as any)?.response?.data?.error || 'Failed to apply. Please try again.'}
            </p>
          )}
          <div className="flex gap-3">
            <button
              onClick={() => applyMutation.mutate()}
              disabled={!proposal.trim() || applyMutation.isPending}
              className="btn-primary flex-1"
            >
              {applyMutation.isPending ? 'Submitting...' : 'Submit Application'}
            </button>
            <button onClick={() => setShowApplyModal(false)} className="btn-secondary">
              Cancel
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
