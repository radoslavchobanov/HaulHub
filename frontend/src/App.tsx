import { useEffect } from 'react'
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { useAuthStore } from './stores/authStore'
import { useThemeStore } from './stores/themeStore'
import Layout from './components/layout/Layout'
import Landing from './pages/Landing'
import Login from './pages/Login'
import Register from './pages/Register'
import RegisterType from './pages/RegisterType'
import Dashboard from './pages/client/Dashboard'
import NewJob from './pages/client/NewJob'
import ClientJobDetail from './pages/client/JobDetail'
import ClientBookingDetail from './pages/client/BookingDetail'
import Board from './pages/hauler/Board'
import HaulerJobDetail from './pages/hauler/JobDetail'
import Applications from './pages/hauler/Applications'
import HaulerBookingDetail from './pages/hauler/BookingDetail'
import Wallet from './pages/shared/Wallet'
import EditProfile from './pages/shared/EditProfile'
import HaulerProfile from './pages/shared/HaulerProfile'
import NegotiationChat from './pages/shared/NegotiationChat'

function RequireAuth({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore()
  const location = useLocation()
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />
  }
  return <>{children}</>
}

function RequireClient({ children }: { children: React.ReactNode }) {
  const { user } = useAuthStore()
  if (user?.user_type !== 'client') return <Navigate to="/board" replace />
  return <>{children}</>
}

function RequireHauler({ children }: { children: React.ReactNode }) {
  const { user } = useAuthStore()
  if (user?.user_type !== 'hauler') return <Navigate to="/dashboard" replace />
  return <>{children}</>
}

function RedirectIfAuth({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, user } = useAuthStore()
  if (isAuthenticated && user) {
    return <Navigate to={user.user_type === 'client' ? '/dashboard' : '/board'} replace />
  }
  return <>{children}</>
}

export default function App() {
  const { isDark } = useThemeStore()

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark)
  }, [isDark])

  return (
    <Routes>
      {/* Public auth pages — no Layout */}
      <Route path="/login" element={<RedirectIfAuth><Login /></RedirectIfAuth>} />
      <Route path="/register" element={<RedirectIfAuth><Register /></RedirectIfAuth>} />
      <Route path="/register/type" element={<RegisterType />} />

      {/* All other pages with Layout */}
      <Route element={<Layout />}>
        <Route path="/" element={<Landing />} />

        {/* Public hauler profiles */}
        <Route path="/haulers/:id" element={<HaulerProfile />} />

        {/* Shared authenticated */}
        <Route path="/wallet" element={<RequireAuth><Wallet /></RequireAuth>} />
        <Route path="/profile" element={<RequireAuth><EditProfile /></RequireAuth>} />
        <Route path="/negotiate/:appId" element={<RequireAuth><NegotiationChat /></RequireAuth>} />

        {/* Client routes */}
        <Route path="/dashboard" element={<RequireAuth><RequireClient><Dashboard /></RequireClient></RequireAuth>} />
        <Route path="/jobs/new" element={<RequireAuth><RequireClient><NewJob /></RequireClient></RequireAuth>} />
        <Route path="/jobs/:id" element={<RequireAuth><RequireClient><ClientJobDetail /></RequireClient></RequireAuth>} />
        <Route path="/bookings/:id" element={
          <RequireAuth>
            <BookingRoute />
          </RequireAuth>
        } />

        {/* Hauler routes */}
        <Route path="/board" element={<RequireAuth><RequireHauler><Board /></RequireHauler></RequireAuth>} />
        <Route path="/board/:id" element={<RequireAuth><RequireHauler><HaulerJobDetail /></RequireHauler></RequireAuth>} />
        <Route path="/applications" element={<RequireAuth><RequireHauler><Applications /></RequireHauler></RequireAuth>} />

        {/* 404 */}
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  )
}

function BookingRoute() {
  const { user } = useAuthStore()
  if (user?.user_type === 'client') return <ClientBookingDetail />
  return <HaulerBookingDetail />
}

function NotFound() {
  return (
    <div className="text-center py-20">
      <svg className="w-16 h-16 mx-auto mb-4 text-navy-300 dark:text-navy-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
      </svg>
      <h1 className="text-2xl font-bold text-navy-900 dark:text-slate-100 mb-2">Page not found</h1>
      <p className="text-navy-500 dark:text-navy-400 mb-6">The page you're looking for doesn't exist.</p>
      <a href="/" className="btn-primary">Go home</a>
    </div>
  )
}
