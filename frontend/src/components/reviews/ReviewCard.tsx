import StarRating from '../ui/StarRating'
import type { Review } from '../../types'
import { format } from 'date-fns'

interface ReviewCardProps {
  review: Review
}

export default function ReviewCard({ review }: ReviewCardProps) {
  return (
    <div className="card">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-gray-100 text-gray-600 flex items-center justify-center font-bold text-sm shrink-0">
            {review.reviewer.first_name[0]}{review.reviewer.last_name[0]}
          </div>
          <div>
            <p className="font-medium text-gray-900 text-sm">{review.reviewer.full_name}</p>
            <StarRating rating={review.rating} size="sm" />
          </div>
        </div>
        <span className="text-xs text-gray-400 shrink-0">
          {format(new Date(review.created_at), 'MMM d, yyyy')}
        </span>
      </div>
      {review.comment && (
        <p className="mt-3 text-sm text-gray-700">{review.comment}</p>
      )}
    </div>
  )
}
