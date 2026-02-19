import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { bookingsApi } from '../../api/bookings'
import ChatWindow from '../../components/chat/ChatWindow'
import Modal from '../../components/ui/Modal'
import ReviewForm from '../../components/reviews/ReviewForm'
import Badge, { jobStatusBadge } from '../../components/ui/Badge'
import StarRating from '../../components/ui/StarRating'
import { PageLoader } from '../../components/ui/LoadingSpinner'
import { Link } from 'react-router-dom'
import { format } from 'date-fns'

export default function ClientBookingDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [showReview, setShowReview] = useState(false)

  const { data: booking, isLoading } = useQuery({
    queryKey: ['booking', id],
    queryFn: () => bookingsApi.get(id!).then((r) => r.data),
    refetchInterval: 30000,
  })

  const completeMutation = useMutation({
    mutationFn: () => bookingsApi.complete(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['booking', id] })
      queryClient.invalidateQueries({ queryKey: ['wallet'] })
    },
  })

  if (isLoading) return <PageLoader />
  if (!booking) return <p className="text-center text-navy-500 dark:text-navy-400">Booking not found.</p>

  const haulerProfile = booking.hauler.hauler_profile

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
              <Badge variant={jobStatusBadge(booking.status)}>{booking.status}</Badge>
              {booking.status === 'active' && booking.days_until_auto_release !== null && (
                <span className="text-xs text-navy-500 dark:text-navy-400">
                  Auto-releases in {booking.days_until_auto_release} days
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

          <div className="card">
            <h3 className="font-semibold text-navy-900 dark:text-white mb-3">Job Info</h3>
            <div className="space-y-2 text-sm">
              <div>
                <span className="text-navy-500 dark:text-navy-400">Scheduled</span>
                <p className="font-medium dark:text-white">{format(new Date(booking.job.scheduled_date), 'PPP p')}</p>
              </div>
              <div>
                <span className="text-navy-500 dark:text-navy-400">Location</span>
                <p className="font-medium dark:text-white">{booking.job.location_address}</p>
              </div>
              <div>
                <span className="text-navy-500 dark:text-navy-400">Escrow amount</span>
                <p className="font-medium text-brand-700">${booking.amount}</p>
              </div>
            </div>
          </div>

          {booking.status === 'active' && (
            <div className="card">
              <p className="text-sm text-navy-600 dark:text-navy-400 mb-3">
                Happy with the work? Release payment to your Hauler.
              </p>
              <button
                onClick={() => completeMutation.mutate()}
                disabled={completeMutation.isPending}
                className="btn-primary w-full"
              >
                {completeMutation.isPending ? 'Processing...' : 'Mark Complete & Release Payment'}
              </button>
              {completeMutation.isError && (
                <p className="mt-2 text-xs text-red-600">Failed to complete. Try again.</p>
              )}
            </div>
          )}

          {booking.status === 'completed' && booking.can_review && (
            <div className="card">
              <p className="text-sm text-navy-600 dark:text-navy-400 mb-3">How was your experience with this Hauler?</p>
              <button onClick={() => setShowReview(true)} className="btn-primary w-full">
                Leave a Review
              </button>
            </div>
          )}

          {booking.status === 'completed' && !booking.can_review && (
            <div className="card bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800">
              <p className="text-sm text-green-800 dark:text-green-400 text-center"><svg className="w-4 h-4 inline-block mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>Job completed</p>
            </div>
          )}
        </div>
      </div>

      <Modal isOpen={showReview} onClose={() => setShowReview(false)} title="Leave a Review">
        <ReviewForm bookingId={id!} onDone={() => setShowReview(false)} />
      </Modal>
    </div>
  )
}
