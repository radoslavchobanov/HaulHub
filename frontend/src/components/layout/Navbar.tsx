import { Link, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../stores/authStore'
import { useQueryClient } from '@tanstack/react-query'

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
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link to="/" className="flex items-center gap-2">
            <span className="text-2xl">🚛</span>
            <span className="text-xl font-bold text-brand-700">HaulHub</span>
          </Link>

          <div className="flex items-center gap-4">
            {isAuthenticated && user ? (
              <>
                {user.user_type === 'client' ? (
                  <>
                    <Link to="/dashboard" className="text-sm font-medium text-gray-600 hover:text-gray-900">
                      My Jobs
                    </Link>
                    <Link to="/jobs/new" className="btn-primary text-sm">
                      Post a Job
                    </Link>
                  </>
                ) : (
                  <>
                    <Link to="/board" className="text-sm font-medium text-gray-600 hover:text-gray-900">
                      Job Board
                    </Link>
                    <Link to="/applications" className="text-sm font-medium text-gray-600 hover:text-gray-900">
                      Applications
                    </Link>
                  </>
                )}
                <Link to="/wallet" className="text-sm font-medium text-gray-600 hover:text-gray-900">
                  Wallet
                </Link>
                <div className="relative group">
                  <button className="flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-gray-900">
                    <div className="w-8 h-8 rounded-full bg-brand-600 text-white flex items-center justify-center text-xs font-bold">
                      {user.first_name[0]}{user.last_name[0]}
                    </div>
                    <span className="hidden sm:block">{user.first_name}</span>
                  </button>
                  <div className="absolute right-0 mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 hidden group-hover:block">
                    {user.user_type === 'hauler' && (
                      <Link to="/profile" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                        Edit Profile
                      </Link>
                    )}
                    <button
                      onClick={handleLogout}
                      className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-50"
                    >
                      Sign Out
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <>
                <Link to="/login" className="text-sm font-medium text-gray-600 hover:text-gray-900">
                  Sign In
                </Link>
                <Link to="/register" className="btn-primary text-sm">
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
