import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { bookingsApi } from '../../api/bookings'
import ChatWindow from '../../components/chat/ChatWindow'
import Modal from '../../components/ui/Modal'
import ReviewForm from '../../components/reviews/ReviewForm'
import Badge, { jobStatusBadge } from '../../components/ui/Badge'
import { PageLoader } from '../../components/ui/LoadingSpinner'
import { Link } from 'react-router-dom'
import { format } from 'date-fns'

export default function HaulerBookingDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [showReview, setShowReview] = useState(false)

  const { data: booking, isLoading } = useQuery({
    queryKey: ['booking', id],
    queryFn: () => bookingsApi.get(id!).then((r) => r.data),
    refetchInterval: 30000,
  })

  if (isLoading) return <PageLoader />
  if (!booking) return <p className="text-center text-navy-500 dark:text-navy-400">Booking not found.</p>

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
              <Badge variant={jobStatusBadge(booking.status)}>{booking.status}</Badge>
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
                <span className="text-navy-500 dark:text-navy-400">Payment</span>
                <p className="font-medium text-brand-700">${booking.amount}</p>
              </div>
            </div>
          </div>

          {booking.status === 'active' && (
            <div className="card bg-yellow-50 border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-800">
              <p className="text-sm text-yellow-800 dark:text-yellow-300">
                Payment of <strong>${booking.amount}</strong> is in escrow. It will be released when the client marks the job complete or automatically in {booking.days_until_auto_release} days.
              </p>
            </div>
          )}

          {booking.status === 'completed' && booking.can_review && (
            <div className="card">
              <p className="text-sm text-navy-600 dark:text-navy-400 mb-3">How was working with this client?</p>
              <button onClick={() => setShowReview(true)} className="btn-primary w-full">
                Leave a Review
              </button>
            </div>
          )}

          {booking.status === 'completed' && !booking.can_review && (
            <div className="card bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800">
              <p className="text-sm text-green-800 dark:text-green-400 text-center"><svg className="w-4 h-4 inline-block mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>Job completed — payment released</p>
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
