import { Navigate, useLocation } from 'react-router-dom'
import { useCurrentUser } from '@/features/auth/api'
import type { UserRole } from '@/types/models'

interface ProtectedRouteProps {
  children: React.ReactNode
  /** If provided, only users with one of these roles are admitted. */
  allowedRoles?: UserRole[]
}

export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const location = useLocation()
  const { data: user, isLoading, isError } = useCurrentUser()

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="flex items-center gap-3 text-sm text-slate-500">
          <span className="h-2 w-2 animate-pulse rounded-full bg-indigo-500" />
          Restoring your session…
        </div>
      </div>
    )
  }

  if (isError || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-2 bg-slate-50 px-6 text-center">
        <h1 className="text-2xl font-semibold text-slate-900">Access denied</h1>
        <p className="text-sm text-slate-500">Your account does not have permission to view this page.</p>
      </div>
    )
  }

  return <>{children}</>
}
