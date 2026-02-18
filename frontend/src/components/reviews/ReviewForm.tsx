import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { reviewsApi } from '../../api/reviews'
import StarRating from '../ui/StarRating'

interface ReviewFormProps {
  bookingId: string
  onDone: () => void
}

export default function ReviewForm({ bookingId, onDone }: ReviewFormProps) {
  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState('')
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: () => reviewsApi.create({ booking_id: bookingId, rating, comment }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['booking', bookingId] })
      onDone()
    },
  })

  return (
    <div className="space-y-4">
      <div>
        <p className="label">Rating</p>
        <StarRating rating={rating} size="lg" interactive onChange={setRating} />
      </div>
      <div>
        <label className="label">Comment (optional)</label>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          className="input"
          rows={3}
          placeholder="Share your experience..."
        />
      </div>
      {mutation.isError && (
        <p className="text-sm text-red-600">
          {(mutation.error as any)?.response?.data?.error || 'Failed to submit review.'}
        </p>
      )}
      <button
        onClick={() => mutation.mutate()}
        disabled={rating === 0 || mutation.isPending}
        className="btn-primary w-full"
      >
        {mutation.isPending ? 'Submitting...' : 'Submit Review'}
      </button>
    </div>
  )
}
