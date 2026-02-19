import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { bookingsApi } from '../../api/bookings'
import ChatWindow from '../../components/chat/ChatWindow'
import Modal from '../../components/ui/Modal'
import ReviewForm from '../../components/reviews/ReviewForm'
import Badge, { bookingStatusBadge } from '../../components/ui/Badge'
import StarRating from '../../components/ui/StarRating'
import { PageLoader } from '../../components/ui/LoadingSpinner'
import { Link } from 'react-router-dom'
import { format } from 'date-fns'

export default function ClientBookingDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [showReview, setShowReview] = useState(false)
  const [showDispute, setShowDispute] = useState(false)
  const [pin, setPin] = useState('')
  const [disputeReason, setDisputeReason] = useState('')

  const { data: booking, isLoading } = useQuery({
    queryKey: ['booking', id],
    queryFn: () => bookingsApi.get(id!).then((r) => r.data),
    refetchInterval: 15000,
  })

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['booking', id] })
    queryClient.invalidateQueries({ queryKey: ['wallet'] })
  }

  const confirmPickupMutation = useMutation({
    mutationFn: () => bookingsApi.confirmPickup(id!, pin),
    onSuccess: () => { invalidate(); setPin('') },
  })

  const completeMutation = useMutation({
    mutationFn: () => bookingsApi.complete(id!),
    onSuccess: invalidate,
  })

  const disputeMutation = useMutation({
    mutationFn: () => bookingsApi.openDispute(id!, disputeReason),
    onSuccess: () => { invalidate(); setShowDispute(false) },
  })

  const noShowMutation = useMutation({
    mutationFn: () => bookingsApi.reportNoShow(id!),
    onSuccess: invalidate,
  })

  if (isLoading) return <PageLoader />
  if (!booking) return <p className="text-center text-navy-500 dark:text-navy-400">Booking not found.</p>

  const haulerProfile = booking.hauler.hauler_profile
  const { status } = booking

  const statusLabels: Record<string, string> = {
    assigned: 'Awaiting Pickup',
    in_progress: 'In Progress',
    pending_completion: 'Pending Your Confirmation',
    completed: 'Completed',
    disputed: 'Disputed',
    resolved_hauler: 'Resolved — Hauler',
    resolved_client: 'Resolved — Client',
    cancelled: 'Cancelled',
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <button onClick={() => navigate('/dashboard')} className="text-sm text-brand-600 hover:text-brand-700 mb-2 flex items-center gap-1.5 transition-colors cursor-pointer">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" /></svg>
          Back to Dashboard
        </button>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-navy-900 dark:text-white">{booking.job.title}</h1>
            <div className="flex items-center gap-3 mt-2">
              <Badge variant={bookingStatusBadge(status)}>{statusLabels[status] ?? status}</Badge>
              {status === 'pending_completion' && booking.hours_until_auto_release !== null && (
                <span className="text-xs text-navy-500 dark:text-navy-400">
                  Auto-releases in {booking.hours_until_auto_release}h
                </span>
              )}
            </div>
          </div>
          <p className="text-2xl font-bold text-brand-700">${booking.amount}</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 h-[500px]">
          {booking.chat_room_id ? (
            <ChatWindow roomId={booking.chat_room_id} />
          ) : (
            <div className="card h-full flex items-center justify-center">
              <p className="text-navy-400 dark:text-navy-500">Chat not available</p>
            </div>
          )}
        </div>

        <div className="space-y-4">
          {/* Hauler card */}
          <div className="card">
            <h3 className="font-semibold text-navy-900 dark:text-white mb-3">Your Hauler</h3>
            <Link to={`/haulers/${booking.hauler.id}`} className="flex items-center gap-3 hover:opacity-80 transition-opacity">
              <div className="w-10 h-10 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center font-bold">
                {booking.hauler.first_name[0]}{booking.hauler.last_name[0]}
              </div>
              <div>
                <p className="font-medium text-navy-900 dark:text-white">{booking.hauler.full_name}</p>
                {haulerProfile && (
                  <div className="flex items-center gap-1 mt-0.5">
                    <StarRating rating={parseFloat(haulerProfile.rating_avg)} size="sm" />
                    <span className="text-xs text-navy-500 dark:text-navy-400">({haulerProfile.review_count})</span>
                  </div>
                )}
              </div>
            </Link>
          </div>

          {/* Job info */}
          <div className="card">
            <h3 className="font-semibold text-navy-900 dark:text-white mb-3">Job Info</h3>
            <div className="space-y-2 text-sm">
              <div>
                <span className="text-navy-500 dark:text-navy-400">Scheduled</span>
                <p className="font-medium dark:text-white">{format(new Date(booking.job.scheduled_date), 'PPP p')}</p>
              </div>
              <div>
                <span className="text-navy-500 dark:text-navy-400">Location</span>
                <p className="font-medium dark:text-white">{booking.job.location_display}</p>
              </div>
              <div>
                <span className="text-navy-500 dark:text-navy-400">Escrow amount</span>
                <p className="font-medium text-brand-700">${booking.amount}</p>
              </div>
            </div>
          </div>

          {/* === STATE MACHINE ACTIONS === */}

          {/* ASSIGNED: enter PIN to confirm pickup */}
          {status === 'assigned' && (
            <div className="card">
              <h3 className="font-semibold text-navy-900 dark:text-white mb-2">Confirm Pickup</h3>
              <p className="text-sm text-navy-500 dark:text-navy-400 mb-3">
                Ask your hauler for the 6-digit pickup PIN to confirm they have arrived.
              </p>
              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                placeholder="Enter PIN"
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                className="input mb-2 text-center tracking-widest text-lg font-mono"
              />
              <button
                onClick={() => confirmPickupMutation.mutate()}
                disabled={pin.length !== 6 || confirmPickupMutation.isPending}
                className="btn-primary w-full"
              >
                {confirmPickupMutation.isPending ? 'Confirming...' : 'Confirm Pickup'}
              </button>
              {confirmPickupMutation.isError && (
                <p className="mt-2 text-xs text-red-600">Wrong PIN or request failed. Try again.</p>
              )}
              <button
                onClick={() => noShowMutation.mutate()}
                disabled={noShowMutation.isPending}
                className="mt-3 w-full text-xs text-red-500 hover:text-red-700 transition-colors cursor-pointer"
              >
                Report No-Show
              </button>
            </div>
          )}

          {/* IN PROGRESS: waiting for hauler */}
          {status === 'in_progress' && (
            <div className="card bg-yellow-50 border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-800">
              <p className="text-sm text-yellow-800 dark:text-yellow-300 font-medium mb-1">Job in progress</p>
              <p className="text-xs text-yellow-700 dark:text-yellow-400">
                Your hauler is working on the job. You'll be asked to confirm completion once they're done.
              </p>
            </div>
          )}

          {/* PENDING COMPLETION: hauler marked done — client confirms or disputes */}
          {status === 'pending_completion' && (
            <div className="card space-y-3">
              <h3 className="font-semibold text-navy-900 dark:text-white">Job marked complete</h3>
              <p className="text-sm text-navy-600 dark:text-navy-400">
                Your hauler says the job is done. Confirm to release payment.
                {booking.hours_until_auto_release !== null && (
                  <span className="block text-xs mt-1 text-navy-400">
                    Auto-releases in {booking.hours_until_auto_release}h if no action taken.
                  </span>
                )}
              </p>

              {/* Evidence photos */}
              {booking.evidence.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-navy-500 dark:text-navy-400 mb-1">Evidence submitted</p>
                  <div className="grid grid-cols-2 gap-2">
                    {booking.evidence.map((ev) => (
                      <div key={ev.id} className="relative">
                        <img src={ev.photo.startsWith('http') ? ev.photo : `/media${ev.photo}`} alt={ev.evidence_type} className="rounded-lg w-full h-20 object-cover" />
                        <span className="absolute top-1 left-1 text-[10px] bg-black/60 text-white rounded px-1">{ev.evidence_type}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <button
                onClick={() => completeMutation.mutate()}
                disabled={completeMutation.isPending}
                className="btn-primary w-full"
              >
                {completeMutation.isPending ? 'Processing...' : 'Confirm Complete & Release Payment'}
              </button>
              <button
                onClick={() => setShowDispute(true)}
                className="w-full text-sm text-red-600 hover:text-red-800 transition-colors cursor-pointer"
              >
                Something went wrong — Open Dispute
              </button>
            </div>
          )}

          {/* DISPUTED */}
          {status === 'disputed' && (
            <div className="card bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800">
              <p className="text-sm font-medium text-red-800 dark:text-red-400 mb-1">Dispute opened</p>
              <p className="text-xs text-red-700 dark:text-red-300">
                Our team is reviewing this booking. You'll be notified of the resolution.
              </p>
            </div>
          )}

          {/* RESOLVED */}
          {(status === 'resolved_hauler' || status === 'resolved_client') && (
            <div className="card bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800">
              <p className="text-sm font-medium text-green-800 dark:text-green-400">
                {status === 'resolved_hauler' ? 'Resolved — payment released to hauler' : 'Resolved — payment returned to you'}
              </p>
            </div>
          )}

          {/* COMPLETED: review prompt */}
          {(status === 'completed' || status === 'resolved_hauler' || status === 'resolved_client') && booking.can_review && (
            <div className="card">
              <p className="text-sm text-navy-600 dark:text-navy-400 mb-3">How was your experience with this Hauler?</p>
              <button onClick={() => setShowReview(true)} className="btn-primary w-full">
                Leave a Review
              </button>
            </div>
          )}

          {(status === 'completed' || status === 'resolved_hauler' || status === 'resolved_client') && !booking.can_review && (
            <div className="card bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800">
              <p className="text-sm text-green-800 dark:text-green-400 text-center">
                <svg className="w-4 h-4 inline-block mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
                Job completed
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Review modal */}
      <Modal isOpen={showReview} onClose={() => setShowReview(false)} title="Leave a Review">
        <ReviewForm bookingId={id!} onDone={() => setShowReview(false)} />
      </Modal>

      {/* Dispute modal */}
      <Modal isOpen={showDispute} onClose={() => setShowDispute(false)} title="Open a Dispute">
        <div className="space-y-4">
          <p className="text-sm text-navy-600 dark:text-navy-400">
            Describe what went wrong. An admin will review the evidence and make a decision.
          </p>
          <textarea
            rows={4}
            placeholder="Describe the issue..."
            value={disputeReason}
            onChange={(e) => setDisputeReason(e.target.value)}
            className="input w-full resize-none"
          />
          <div className="flex gap-3">
            <button onClick={() => setShowDispute(false)} className="btn-secondary flex-1">Cancel</button>
            <button
              onClick={() => disputeMutation.mutate()}
              disabled={!disputeReason.trim() || disputeMutation.isPending}
              className="btn-primary flex-1 bg-red-600 hover:bg-red-700"
            >
              {disputeMutation.isPending ? 'Submitting...' : 'Submit Dispute'}
            </button>
          </div>
          {disputeMutation.isError && (
            <p className="text-xs text-red-600">Failed to open dispute. Try again.</p>
          )}
        </div>
      </Modal>
    </div>
  )
}
