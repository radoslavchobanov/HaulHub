import { useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { reviewsApi } from '../../api/reviews'
import StarRating from '../../components/ui/StarRating'
import ReviewCard from '../../components/reviews/ReviewCard'
import Badge from '../../components/ui/Badge'
import { PageLoader } from '../../components/ui/LoadingSpinner'
import { format } from 'date-fns'

export default function HaulerProfile() {
  const { id } = useParams<{ id: string }>()

  const { data: hauler, isLoading } = useQuery({
    queryKey: ['hauler', id],
    queryFn: () => reviewsApi.haulerDetail(id!).then((r) => r.data),
  })

  const { data: reviews } = useQuery({
    queryKey: ['hauler-reviews', id],
    queryFn: () => reviewsApi.forHauler(id!).then((r) => r.data),
    enabled: !!id,
  })

  if (isLoading) return <PageLoader />
  if (!hauler) return <p className="text-center text-navy-500 dark:text-navy-400">Hauler not found.</p>

  const profile = hauler.hauler_profile

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="card">
        <div className="flex items-start gap-6">
          <div className="w-20 h-20 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center text-2xl font-bold shrink-0">
            {profile?.profile_photo ? (
              <img src={profile.profile_photo} alt={hauler.full_name} className="w-20 h-20 rounded-full object-cover" />
            ) : (
              `${hauler.first_name[0]}${hauler.last_name[0]}`
            )}
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-navy-900 dark:text-white">{hauler.full_name}</h1>
            <div className="flex items-center gap-3 mt-2">
              {profile && (
                <>
                  <StarRating rating={parseFloat(profile.rating_avg)} size="md" />
                  <span className="text-sm text-navy-600 dark:text-navy-400">
                    {profile.rating_avg} ({profile.review_count} review{profile.review_count !== 1 ? 's' : ''})
                  </span>
                </>
              )}
            </div>
            <p className="text-sm text-navy-500 dark:text-navy-400 mt-1">
              Member since {format(new Date(hauler.created_at), 'MMMM yyyy')}
            </p>
          </div>
        </div>

        {profile?.bio && (
          <div className="mt-5 pt-5 border-t border-navy-100 dark:border-navy-700">
            <h3 className="font-semibold text-navy-900 dark:text-white mb-2">About</h3>
            <p className="text-navy-700 dark:text-navy-300 whitespace-pre-line">{profile.bio}</p>
          </div>
        )}

        {profile?.skills && profile.skills.length > 0 && (
          <div className="mt-4">
            <h3 className="font-semibold text-navy-900 dark:text-white mb-2">Skills</h3>
            <div className="flex flex-wrap gap-2">
              {profile.skills.map((skill: string) => (
                <Badge key={skill} variant="blue">{skill}</Badge>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Reviews */}
      <section>
        <h2 className="text-lg font-semibold text-navy-900 dark:text-white mb-4">
          Reviews ({reviews?.length || 0})
        </h2>
        {reviews?.length === 0 && (
          <div className="card text-center py-10">
            <p className="text-navy-500 dark:text-navy-400">No reviews yet.</p>
          </div>
        )}
        <div className="space-y-4">
          {reviews?.map((review) => <ReviewCard key={review.id} review={review} />)}
        </div>
      </section>
    </div>
  )
}
