interface BadgeProps {
  children: React.ReactNode
  variant?: 'green' | 'blue' | 'yellow' | 'red' | 'gray' | 'purple'
}

const variants = {
  green: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  blue: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  yellow: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  red: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  gray: 'bg-navy-100 text-navy-700 dark:bg-navy-700 dark:text-navy-300',
  purple: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
}

export default function Badge({ children, variant = 'gray' }: BadgeProps) {
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${variants[variant]}`}>
      {children}
    </span>
  )
}

export function jobStatusBadge(status: string) {
  const map: Record<string, 'blue' | 'yellow' | 'green' | 'red' | 'gray' | 'purple'> = {
    open: 'blue',
    assigned: 'yellow',
    in_progress: 'yellow',
    pending_completion: 'purple',
    completed: 'green',
    cancelled: 'red',
  }
  return map[status] ?? 'gray'
}

export function bookingStatusBadge(status: string) {
  const map: Record<string, 'blue' | 'yellow' | 'green' | 'red' | 'gray' | 'purple'> = {
    assigned: 'yellow',
    in_progress: 'yellow',
    pending_completion: 'purple',
    completed: 'green',
    disputed: 'red',
    resolved_hauler: 'green',
    resolved_client: 'green',
    cancelled: 'gray',
  }
  return map[status] ?? 'gray'
}

export function applicationStatusBadge(status: string) {
  const map: Record<string, 'yellow' | 'green' | 'red' | 'purple'> = {
    pending: 'yellow',
    negotiating: 'purple',
    accepted: 'green',
    rejected: 'red',
  }
  return map[status] ?? 'yellow'
}
