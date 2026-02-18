import { Link } from 'react-router-dom'
import { format } from 'date-fns'
import Badge, { jobStatusBadge, applicationStatusBadge } from '../ui/Badge'
import type { Job } from '../../types'
import { useAuthStore } from '../../stores/authStore'

interface JobCardProps {
  job: Job
  linkTo?: string
}

export default function JobCard({ job, linkTo }: JobCardProps) {
  const { user } = useAuthStore()
  const isHauler = user?.user_type === 'hauler'
  const href = linkTo ?? (isHauler ? `/board/${job.id}` : `/jobs/${job.id}`)

  return (
    <Link to={href} className="card block hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-4 mb-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-900 truncate">{job.title}</h3>
          <p className="text-sm text-gray-500 mt-0.5">Posted by {job.client.full_name}</p>
        </div>
        <div className="flex flex-col items-end gap-1 shrink-0">
          <span className="text-lg font-bold text-brand-700">${job.budget}</span>
          <Badge variant={jobStatusBadge(job.status)}>{job.status_display}</Badge>
        </div>
      </div>

      <p className="text-sm text-gray-600 line-clamp-2 mb-3">{job.description}</p>

      <div className="flex items-center gap-4 text-xs text-gray-500 flex-wrap">
        <span className="flex items-center gap-1">
          <span>📦</span> {job.category_display}
        </span>
        <span className="flex items-center gap-1">
          <span>📍</span> {job.location_address}
        </span>
        <span className="flex items-center gap-1">
          <span>📅</span> {format(new Date(job.scheduled_date), 'MMM d, yyyy')}
        </span>
        {isHauler && job.application_count > 0 && (
          <span className="flex items-center gap-1">
            <span>👥</span> {job.application_count} applicant{job.application_count !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      {isHauler && job.my_application && (
        <div className="mt-3 pt-3 border-t border-gray-100">
          <span className="text-xs text-gray-500">Your application: </span>
          <Badge variant={applicationStatusBadge(job.my_application.status)}>
            {job.my_application.status}
          </Badge>
        </div>
      )}
    </Link>
  )
}
