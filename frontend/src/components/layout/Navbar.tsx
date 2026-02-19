import { Link, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../stores/authStore'
import { useQueryClient } from '@tanstack/react-query'
import ThemeToggle from '../ui/ThemeToggle'

export default function Navbar() {
  const { user, logout, isAuthenticated } = useAuthStore()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const handleLogout = () => {
    logout()
    queryClient.clear()
    navigate('/')
  }

  return (
    <nav className="bg-navy-900 dark:bg-navy-950 border-b border-navy-800 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">

          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-lg bg-brand-600 flex items-center justify-center shrink-0 group-hover:bg-brand-500 transition-colors">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
              </svg>
            </div>
            <span className="text-lg font-bold text-white tracking-tight">HaulHub</span>
          </Link>

          {/* Right side */}
          <div className="flex items-center gap-1">
            {isAuthenticated && user ? (
              <>
                {/* Nav links */}
                <div className="hidden sm:flex items-center gap-1 mr-2">
                  {user.user_type === 'client' ? (
                    <>
                      <NavLink to="/dashboard">My Jobs</NavLink>
                      <Link to="/jobs/new" className="ml-1 btn-primary text-sm py-2 px-3.5">
                        Post a Job
                      </Link>
                    </>
                  ) : (
                    <>
                      <NavLink to="/board">Job Board</NavLink>
                      <NavLink to="/applications">Applications</NavLink>
                    </>
                  )}
                  <NavLink to="/wallet">Wallet</NavLink>
                </div>

                <ThemeToggle />

                {/* User menu */}
                <div className="relative group ml-1">
                  <button className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-navy-800 transition-colors cursor-pointer">
                    <div className="w-7 h-7 rounded-full bg-brand-600 text-white flex items-center justify-center text-xs font-bold shrink-0">
                      {user.first_name[0]}{user.last_name[0]}
                    </div>
                    <span className="hidden sm:block text-sm font-medium text-navy-200">{user.first_name}</span>
                    <svg className="w-3.5 h-3.5 text-navy-400 hidden sm:block" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                    </svg>
                  </button>
                  {/* Dropdown */}
                  <div className="absolute right-0 mt-1.5 w-52 bg-white dark:bg-navy-800 rounded-xl shadow-lg border border-navy-100 dark:border-navy-700 py-1.5 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-150 origin-top-right scale-95 group-hover:scale-100">
                    <div className="px-3 py-2 border-b border-navy-100 dark:border-navy-700 mb-1">
                      <p className="text-xs font-semibold text-navy-900 dark:text-white">{user.first_name} {user.last_name}</p>
                      <p className="text-xs text-navy-500 dark:text-navy-400 capitalize">{user.user_type}</p>
                    </div>
                    {/* Mobile nav links */}
                    <div className="sm:hidden px-1 py-1 border-b border-navy-100 dark:border-navy-700 mb-1">
                      {user.user_type === 'client' ? (
                        <Link to="/dashboard" className="block px-2 py-1.5 text-sm text-navy-700 dark:text-navy-200 hover:bg-navy-50 dark:hover:bg-navy-700 rounded-lg">My Jobs</Link>
                      ) : (
                        <>
                          <Link to="/board" className="block px-2 py-1.5 text-sm text-navy-700 dark:text-navy-200 hover:bg-navy-50 dark:hover:bg-navy-700 rounded-lg">Job Board</Link>
                          <Link to="/applications" className="block px-2 py-1.5 text-sm text-navy-700 dark:text-navy-200 hover:bg-navy-50 dark:hover:bg-navy-700 rounded-lg">Applications</Link>
                        </>
                      )}
                      <Link to="/wallet" className="block px-2 py-1.5 text-sm text-navy-700 dark:text-navy-200 hover:bg-navy-50 dark:hover:bg-navy-700 rounded-lg">Wallet</Link>
                    </div>
                    {user.user_type === 'hauler' && (
                      <Link to="/profile" className="flex items-center gap-2 px-3 py-2 text-sm text-navy-700 dark:text-navy-200 hover:bg-navy-50 dark:hover:bg-navy-700 rounded-lg mx-1 cursor-pointer">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" /></svg>
                        Edit Profile
                      </Link>
                    )}
                    <button onClick={handleLogout} className="flex items-center gap-2 w-full text-left px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg mx-1 cursor-pointer">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" /></svg>
                      Sign Out
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <>
                <ThemeToggle />
                <Link to="/login" className="px-3 py-2 text-sm font-medium text-navy-300 hover:text-white transition-colors rounded-lg hover:bg-navy-800 cursor-pointer">
                  Sign In
                </Link>
                <Link to="/register" className="btn-primary text-sm py-2 px-3.5 ml-1">
                  Get Started
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}

function NavLink({ to, children }: { to: string; children: React.ReactNode }) {
  return (
    <Link
      to={to}
      className="px-3 py-2 text-sm font-medium text-navy-300 hover:text-white transition-colors rounded-lg hover:bg-navy-800 cursor-pointer"
    >
      {children}
    </Link>
  )
}
