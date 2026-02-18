import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { useAuthStore } from './stores/authStore'
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
      <p className="text-6xl mb-4">🚛</p>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Page not found</h1>
      <p className="text-gray-600 mb-6">The page you're looking for doesn't exist.</p>
      <a href="/" className="btn-primary">Go home</a>
    </div>
  )
}
