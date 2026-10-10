import { Navigate, useLocation } from 'react-router-dom'
import { useCurrentUser } from '@/features/auth/api'
import type { UserRole } from '@/types/models'

interface ProtectedRouteProps {
  children: React.ReactNode
  /** If provided, only users with one of these roles are admitted. */
  allowedRoles?: UserRole[]
}

/**
 * Wraps a route that requires an authenticated session.
 * - While the session is loading, renders a neutral loading state.
 * - Unauthenticated users are redirected to /login (with return path preserved).
 * - Authenticated users without the required role see a 403 message.
 */
export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const location = useLocation()
  const { data: user, isLoading, isError } = useCurrentUser()

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <span className="text-sm text-gray-500">Loading…</span>
      </div>
    )
  }

  // Unauthenticated or session error → redirect to login
  if (isError || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  // Role guard
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-2">
        <h1 className="text-2xl font-bold text-gray-900">Access denied</h1>
        <p className="text-gray-500 text-sm">You don't have permission to view this page.</p>
      </div>
    )
  }

  return <>{children}</>
}
