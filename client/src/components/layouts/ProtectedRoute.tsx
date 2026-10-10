import { Link, Navigate, useLocation } from 'react-router-dom'
import { AlertTriangle, LoaderCircle, RefreshCw } from 'lucide-react'
import { useCurrentUser } from '@/features/auth/api'
import type { UserRole } from '@/types/models'
import { ApiRequestError } from '@/lib/api-client'
import { AppHeader } from '@/components/layouts/AppHeader'

interface ProtectedRouteProps {
  children: React.ReactNode
  /** If provided, only users with one of these roles are admitted. */
  allowedRoles?: UserRole[]
}

export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const location = useLocation()
  const userQuery = useCurrentUser()
  const { data: user, isLoading, isError, error } = userQuery
  const isUnauthorized = error instanceof ApiRequestError && error.status === 401

  if (isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center px-5 text-sm text-slate-500" role="status">
        <span className="inline-flex items-center gap-2"><LoaderCircle size={16} className="animate-spin" /> Restoring your session…</span>
      </main>
    )
  }

  // A genuine 401 means there is no usable session. Network/5xx failures should
  // not quietly turn into a login redirect and make users think they were signed out.
  if (isError && !isUnauthorized) {
    return (
      <div className="min-h-screen bg-[#f7f8fc]">
        <AppHeader showNotifications={false} />
        <main className="flex min-h-[60vh] items-center justify-center px-5 py-10">
          <section className="dr-panel w-full max-w-md p-6 text-center sm:p-8">
            <AlertTriangle size={22} className="mx-auto text-amber-700" aria-hidden="true" />
            <h1 className="mt-3 text-lg font-semibold text-slate-950">Couldn't verify your session</h1>
            <p className="mt-2 text-sm leading-6 text-slate-500">The server didn't confirm your account. Retry before signing in again.</p>
            <div className="mt-5 flex flex-wrap justify-center gap-2">
              <button type="button" onClick={() => void userQuery.refetch()} className="dr-primary-button"><RefreshCw size={15} /> Try again</button>
              <Link to="/" className="dr-quiet-button">Home</Link>
            </div>
          </section>
        </main>
      </div>
    )
  }

  if (isUnauthorized || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-3 px-6 text-center">
        <h1 className="text-2xl font-semibold text-slate-950">Access denied</h1>
        <p className="max-w-md text-sm text-slate-500">Your account doesn't have permission to view this page.</p>
        <Link to="/workspace" className="dr-primary-button">Return to workspace</Link>
      </main>
    )
  }

  return <>{children}</>
}
