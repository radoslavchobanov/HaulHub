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
    <Link to={href} className="card block hover:shadow-md hover:border-navy-200 dark:hover:border-navy-600 transition-all duration-150">
      <div className="flex items-start justify-between gap-4 mb-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-navy-900 dark:text-white truncate">{job.title}</h3>
          <p className="text-sm text-navy-500 dark:text-navy-400 mt-0.5">Posted by {job.client.full_name}</p>
        </div>
        <div className="flex flex-col items-end gap-1 shrink-0">
          <span className="text-lg font-bold text-brand-600">${job.budget}</span>
          <Badge variant={jobStatusBadge(job.status)}>{job.status_display}</Badge>
        </div>
      </div>

      <p className="text-sm text-navy-600 dark:text-navy-400 line-clamp-2 mb-3">{job.description}</p>

      <div className="flex items-center gap-4 text-xs text-navy-500 dark:text-navy-400 flex-wrap">
        <span className="flex items-center gap-1.5">
          <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21 7.5l-9-5.25L3 7.5m18 0l-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9" /></svg>
          {job.category_display}
        </span>
        <span className="flex items-center gap-1.5">
          <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" /></svg>
          {job.location_address}
        </span>
        <span className="flex items-center gap-1.5">
          <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" /></svg>
          {format(new Date(job.scheduled_date), 'MMM d, yyyy')}
        </span>
        {isHauler && job.application_count > 0 && (
          <span className="flex items-center gap-1.5">
            <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" /></svg>
            {job.application_count} applicant{job.application_count !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      {isHauler && job.my_application && (
        <div className="mt-3 pt-3 border-t border-navy-100 dark:border-navy-700">
          <span className="text-xs text-navy-500 dark:text-navy-400">Your application: </span>
          <Badge variant={applicationStatusBadge(job.my_application.status)}>
            {job.my_application.status}
          </Badge>
        </div>
      )}
    </Link>
  )
}
