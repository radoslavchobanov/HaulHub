import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState, useRef } from 'react'
import { bookingsApi } from '../../api/bookings'
import ChatWindow from '../../components/chat/ChatWindow'
import Modal from '../../components/ui/Modal'
import ReviewForm from '../../components/reviews/ReviewForm'
import Badge, { bookingStatusBadge } from '../../components/ui/Badge'
import { PageLoader } from '../../components/ui/LoadingSpinner'
import { Link } from 'react-router-dom'
import { format } from 'date-fns'

export default function HaulerBookingDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [showReview, setShowReview] = useState(false)
  const [showAmendment, setShowAmendment] = useState(false)
  const [amendBudget, setAmendBudget] = useState('')
  const [amendReason, setAmendReason] = useState('')
  const pickupInputRef = useRef<HTMLInputElement>(null)
  const dropoffInputRef = useRef<HTMLInputElement>(null)

  const { data: booking, isLoading } = useQuery({
    queryKey: ['booking', id],
    queryFn: () => bookingsApi.get(id!).then((r) => r.data),
    refetchInterval: 15000,
  })

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['booking', id] })
    queryClient.invalidateQueries({ queryKey: ['wallet'] })
  }

  const uploadEvidence = useMutation({
    mutationFn: ({ type, file }: { type: 'pickup' | 'dropoff'; file: File }) => {
      const fd = new FormData()
      fd.append('evidence_type', type)
      fd.append('photo', file)
      // Geolocation — best-effort; backend allows null in dev
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition((pos) => {
          fd.append('lat', String(pos.coords.latitude))
          fd.append('lng', String(pos.coords.longitude))
        })
      }
      return bookingsApi.uploadEvidence(id!, fd)
    },
    onSuccess: invalidate,
  })

  const markDoneMutation = useMutation({
    mutationFn: () => bookingsApi.markDone(id!),
    onSuccess: invalidate,
  })

  const amendmentMutation = useMutation({
    mutationFn: () => bookingsApi.requestAmendment(id!, amendBudget, amendReason),
    onSuccess: () => { invalidate(); setShowAmendment(false) },
  })

  const handleFileChange = (type: 'pickup' | 'dropoff') => (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) uploadEvidence.mutate({ type, file })
  }

  if (isLoading) return <PageLoader />
  if (!booking) return <p className="text-center text-navy-500 dark:text-navy-400">Booking not found.</p>

  const { status } = booking

  const hasPickupEvidence = booking.evidence.some((e) => e.evidence_type === 'pickup')
  const hasDropoffEvidence = booking.evidence.some((e) => e.evidence_type === 'dropoff')

  const statusLabels: Record<string, string> = {
    assigned: 'Awaiting Pickup Confirmation',
    in_progress: 'In Progress',
    pending_completion: 'Awaiting Client Confirmation',
    completed: 'Completed',
    disputed: 'Disputed',
    resolved_hauler: 'Resolved — You were paid',
    resolved_client: 'Resolved — Refunded to client',
    cancelled: 'Cancelled',
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <button onClick={() => navigate('/applications')} className="text-sm text-brand-600 hover:text-brand-700 mb-2 flex items-center gap-1.5 transition-colors cursor-pointer">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" /></svg>
          Back to Applications
        </button>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-navy-900 dark:text-white">{booking.job.title}</h1>
            <div className="flex items-center gap-3 mt-2">
              <Badge variant={bookingStatusBadge(status)}>{statusLabels[status] ?? status}</Badge>
            </div>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-brand-700">${booking.amount}</p>
            <p className="text-sm text-navy-500 dark:text-navy-400">your earnings</p>
          </div>
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
          {/* Client card */}
          <div className="card">
            <h3 className="font-semibold text-navy-900 dark:text-white mb-3">Client</h3>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-navy-100 dark:bg-navy-700 text-navy-600 dark:text-navy-300 flex items-center justify-center font-bold">
                {booking.client.first_name[0]}{booking.client.last_name[0]}
              </div>
              <div>
                <p className="font-medium text-navy-900 dark:text-white">{booking.client.full_name}</p>
                <p className="text-sm text-navy-500 dark:text-navy-400">{booking.client.email}</p>
              </div>
            </div>
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
                <span className="text-navy-500 dark:text-navy-400">Payment</span>
                <p className="font-medium text-brand-700">${booking.amount}</p>
              </div>
            </div>
          </div>

          {/* === STATE MACHINE ACTIONS === */}

          {/* ASSIGNED: show pickup PIN prominently */}
          {status === 'assigned' && booking.pickup_pin && (
            <div className="card border-brand-300 dark:border-brand-700">
              <h3 className="font-semibold text-navy-900 dark:text-white mb-2">Pickup PIN</h3>
              <p className="text-xs text-navy-500 dark:text-navy-400 mb-3">
                Share this PIN with the client. They'll enter it to confirm you've arrived.
              </p>
              <div className="bg-brand-50 dark:bg-brand-900/20 rounded-xl py-4 text-center">
                <p className="text-4xl font-mono font-bold tracking-[0.3em] text-brand-700 dark:text-brand-400">
                  {booking.pickup_pin}
                </p>
              </div>
              <button
                onClick={() => setShowAmendment(true)}
                className="mt-3 w-full text-xs text-navy-500 hover:text-navy-700 dark:hover:text-navy-300 transition-colors cursor-pointer"
              >
                Request scope amendment
              </button>
            </div>
          )}

          {/* IN PROGRESS: upload evidence + mark done */}
          {status === 'in_progress' && (
            <div className="card space-y-3">
              <h3 className="font-semibold text-navy-900 dark:text-white">Complete the Job</h3>

              {/* Pickup evidence */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-navy-600 dark:text-navy-400">Pickup photo</span>
                  {hasPickupEvidence && <span className="text-xs text-green-600">✓ Uploaded</span>}
                </div>
                <input ref={pickupInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFileChange('pickup')} />
                <button
                  onClick={() => pickupInputRef.current?.click()}
                  disabled={uploadEvidence.isPending}
                  className={`w-full text-sm py-2 rounded-lg border transition-colors cursor-pointer ${hasPickupEvidence ? 'border-green-300 bg-green-50 text-green-700 dark:bg-green-900/20 dark:border-green-700 dark:text-green-400' : 'border-navy-200 dark:border-navy-600 hover:bg-navy-50 dark:hover:bg-navy-700 text-navy-600 dark:text-navy-300'}`}
                >
                  {hasPickupEvidence ? 'Re-upload pickup photo' : '📷 Upload pickup photo'}
                </button>
              </div>

              {/* Dropoff evidence */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-navy-600 dark:text-navy-400">Dropoff photo</span>
                  {hasDropoffEvidence && <span className="text-xs text-green-600">✓ Uploaded</span>}
                </div>
                <input ref={dropoffInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFileChange('dropoff')} />
                <button
                  onClick={() => dropoffInputRef.current?.click()}
                  disabled={uploadEvidence.isPending}
                  className={`w-full text-sm py-2 rounded-lg border transition-colors cursor-pointer ${hasDropoffEvidence ? 'border-green-300 bg-green-50 text-green-700 dark:bg-green-900/20 dark:border-green-700 dark:text-green-400' : 'border-navy-200 dark:border-navy-600 hover:bg-navy-50 dark:hover:bg-navy-700 text-navy-600 dark:text-navy-300'}`}
                >
                  {hasDropoffEvidence ? 'Re-upload dropoff photo' : '📷 Upload dropoff photo'}
                </button>
              </div>

              {uploadEvidence.isError && (
                <p className="text-xs text-red-600">Upload failed. Try again.</p>
              )}

              <button
                onClick={() => markDoneMutation.mutate()}
                disabled={!hasPickupEvidence || !hasDropoffEvidence || markDoneMutation.isPending}
                className="btn-primary w-full disabled:opacity-50"
              >
                {markDoneMutation.isPending ? 'Submitting...' : 'Mark Job Done'}
              </button>
              {(!hasPickupEvidence || !hasDropoffEvidence) && (
                <p className="text-xs text-navy-400 text-center">Upload both photos to mark done.</p>
              )}
              {markDoneMutation.isError && (
                <p className="text-xs text-red-600">Failed to mark done. Try again.</p>
              )}

              <button
                onClick={() => setShowAmendment(true)}
                className="w-full text-xs text-navy-500 hover:text-navy-700 dark:hover:text-navy-300 transition-colors cursor-pointer"
              >
                Request scope amendment
              </button>
            </div>
          )}

          {/* PENDING COMPLETION: waiting for client */}
          {status === 'pending_completion' && (
            <div className="card bg-yellow-50 border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-800">
              <p className="text-sm font-medium text-yellow-800 dark:text-yellow-300 mb-1">Waiting for client</p>
              <p className="text-xs text-yellow-700 dark:text-yellow-400">
                Your completion request is pending client confirmation.
                {booking.hours_until_auto_release !== null && (
                  <span className="block mt-1">
                    Payment auto-releases in <strong>{booking.hours_until_auto_release}h</strong>.
                  </span>
                )}
              </p>
            </div>
          )}

          {/* DISPUTED */}
          {status === 'disputed' && (
            <div className="card bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800">
              <p className="text-sm font-medium text-red-800 dark:text-red-400 mb-1">Dispute in progress</p>
              <p className="text-xs text-red-700 dark:text-red-300">
                The client opened a dispute. Our team is reviewing the evidence.
              </p>
            </div>
          )}

          {/* RESOLVED */}
          {(status === 'resolved_hauler' || status === 'resolved_client') && (
            <div className="card bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800">
              <p className="text-sm font-medium text-green-800 dark:text-green-400">
                {status === 'resolved_hauler' ? '✓ Payment released to you' : 'Dispute resolved — refunded to client'}
              </p>
            </div>
          )}

          {/* Evidence list */}
          {booking.evidence.length > 0 && (
            <div className="card">
              <h3 className="font-semibold text-navy-900 dark:text-white mb-3">Evidence</h3>
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

          {/* Review prompt */}
          {(status === 'completed' || status === 'resolved_hauler') && booking.can_review && (
            <div className="card">
              <p className="text-sm text-navy-600 dark:text-navy-400 mb-3">How was working with this client?</p>
              <button onClick={() => setShowReview(true)} className="btn-primary w-full">
                Leave a Review
              </button>
            </div>
          )}

          {(status === 'completed' || status === 'resolved_hauler') && !booking.can_review && (
            <div className="card bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800">
              <p className="text-sm text-green-800 dark:text-green-400 text-center">
                <svg className="w-4 h-4 inline-block mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
                Job completed — payment released
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Review modal */}
      <Modal isOpen={showReview} onClose={() => setShowReview(false)} title="Leave a Review">
        <ReviewForm bookingId={id!} onDone={() => setShowReview(false)} />
      </Modal>

      {/* Amendment modal */}
      <Modal isOpen={showAmendment} onClose={() => setShowAmendment(false)} title="Request Scope Amendment">
        <div className="space-y-4">
          <p className="text-sm text-navy-600 dark:text-navy-400">
            Propose a revised budget if the job scope has changed. The client must approve before the escrow is adjusted.
          </p>
          <div>
            <label className="block text-sm font-medium text-navy-700 dark:text-navy-300 mb-1">New budget ($)</label>
            <input
              type="number"
              step="0.01"
              min="1"
              placeholder={booking.amount}
              value={amendBudget}
              onChange={(e) => setAmendBudget(e.target.value)}
              className="input w-full"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-navy-700 dark:text-navy-300 mb-1">Reason</label>
            <textarea
              rows={3}
              placeholder="Explain why the scope changed..."
              value={amendReason}
              onChange={(e) => setAmendReason(e.target.value)}
              className="input w-full resize-none"
            />
          </div>
          <div className="flex gap-3">
            <button onClick={() => setShowAmendment(false)} className="btn-secondary flex-1">Cancel</button>
            <button
              onClick={() => amendmentMutation.mutate()}
              disabled={!amendBudget || !amendReason.trim() || amendmentMutation.isPending}
              className="btn-primary flex-1"
            >
              {amendmentMutation.isPending ? 'Sending...' : 'Send Amendment'}
            </button>
          </div>
          {amendmentMutation.isError && (
            <p className="text-xs text-red-600">Failed to send amendment. Try again.</p>
          )}
        </div>
      </Modal>
    </div>
  )
}
