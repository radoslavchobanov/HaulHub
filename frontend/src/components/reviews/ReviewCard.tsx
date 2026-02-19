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
          <div className="w-9 h-9 rounded-full bg-navy-100 dark:bg-navy-700 text-navy-600 dark:text-navy-300 flex items-center justify-center font-bold text-sm shrink-0">
            {review.reviewer.first_name[0]}{review.reviewer.last_name[0]}
          </div>
          <div>
            <p className="font-medium text-navy-900 dark:text-white text-sm">{review.reviewer.full_name}</p>
            <StarRating rating={review.rating} size="sm" />
          </div>
        </div>
        <span className="text-xs text-navy-400 dark:text-navy-500 shrink-0">
          {format(new Date(review.created_at), 'MMM d, yyyy')}
        </span>
      </div>
      {review.comment && (
        <p className="mt-3 text-sm text-navy-700 dark:text-navy-300">{review.comment}</p>
      )}
    </div>
  )
}
