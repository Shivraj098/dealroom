import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AlertTriangle, LoaderCircle, RefreshCw } from 'lucide-react'
import { useCurrentUser } from '@/features/auth/api'
import { useMyProfile } from '@/features/profiles/api'
import { ProtectedRoute } from '@/components/layouts/ProtectedRoute'
import { ApiRequestError } from '@/lib/api-client'
import { AppHeader } from '@/components/layouts/AppHeader'
import { HomePage } from '@/pages/HomePage'
import { LoginPage } from '@/features/auth/pages/LoginPage'
import { RegisterPage } from '@/features/auth/pages/RegisterPage'
import { OnboardingPage } from '@/features/profiles/pages/OnboardingPage'
import { WorkspacePage } from '@/pages/WorkspacePage'
import { InvestorRoute } from '@/components/layouts/InvestorRoute'
import { StartupDiscoveryPage } from '@/pages/StartupDiscoveryPage'
import { StartupDetailPage } from '@/pages/StartupDetailPage'
import { DealRoomPage } from '@/pages/DealRoomPage'
import { NotFoundPage } from '@/pages/NotFoundPage'

function FullPageLoader({ label = 'Loading your workspace…' }: { label?: string }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-5">
      <div role="status" className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-5 py-4 text-sm text-slate-600 shadow-sm">
        <LoaderCircle size={17} className="animate-spin text-indigo-600" />
        {label}
      </div>
    </div>
  )
}

/** Route authenticated users to onboarding or workspace according to saved profile state. */
function AuthGuard({ children }: { children: React.ReactNode }) {
  const userQuery = useCurrentUser()
  const { data: user, isLoading, isError, error } = userQuery
  const isUnauthorized = error instanceof ApiRequestError && error.status === 401
  const profileQuery = useMyProfile(Boolean(user && !isUnauthorized && user.role !== 'admin'))

  if (isLoading) return <FullPageLoader label="Checking your session…" />
  if (!user && isError && !isUnauthorized) {
    return (
      <main className="flex min-h-screen items-center justify-center px-5 py-10">
        <section className="dr-panel w-full max-w-md p-6 text-center sm:p-8">
          <AlertTriangle size={22} className="mx-auto text-amber-700" aria-hidden="true" />
          <h1 className="mt-3 text-lg font-semibold text-slate-950">Couldn't check your session</h1>
          <p className="mt-2 text-sm leading-6 text-slate-500">The server didn't respond as expected. Retry before continuing.</p>
          <button type="button" onClick={() => void userQuery.refetch()} className="dr-primary-button mx-auto mt-5"><RefreshCw size={15} /> Try again</button>
        </section>
      </main>
    )
  }
  if (!user || isUnauthorized) return <>{children}</>
  if (user.role === 'admin') return <Navigate to="/workspace" replace />

  if (profileQuery.isError) {
    return (
      <div className="min-h-screen bg-[#f7f8fc]">
        <AppHeader showNotifications={false} />
        <main className="flex min-h-[60vh] items-center justify-center px-5 py-10">
          <section className="dr-panel w-full max-w-md p-6 text-center sm:p-8">
            <RefreshCw size={20} className="mx-auto text-amber-700" aria-hidden="true" />
            <h1 className="mt-3 text-xl font-semibold tracking-tight text-slate-950">Profile unavailable</h1>
            <p className="mt-2 text-sm leading-6 text-slate-500">Your session is active, but the profile couldn't be loaded. Retry or use Sign out above to switch accounts.</p>
            <button type="button" onClick={() => void profileQuery.refetch()} className="dr-primary-button mx-auto mt-5"><RefreshCw size={15} /> Try again</button>
          </section>
        </main>
      </div>
    )
  }

  if (profileQuery.isLoading || !profileQuery.data) return <FullPageLoader />
  return <Navigate to={profileQuery.data.onboardingComplete ? '/workspace' : '/onboarding'} replace />
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<AuthGuard><LoginPage /></AuthGuard>} />
        <Route path="/register" element={<AuthGuard><RegisterPage /></AuthGuard>} />
        <Route path="/onboarding" element={<ProtectedRoute><OnboardingPage /></ProtectedRoute>} />
        <Route path="/workspace" element={<ProtectedRoute><WorkspacePage /></ProtectedRoute>} />
        <Route path="/discover" element={<ProtectedRoute allowedRoles={['investor']}><InvestorRoute><StartupDiscoveryPage /></InvestorRoute></ProtectedRoute>} />
        <Route path="/discover/:startupId" element={<ProtectedRoute allowedRoles={['investor']}><InvestorRoute><StartupDetailPage /></InvestorRoute></ProtectedRoute>} />
        <Route path="/deal-rooms/:dealRoomId" element={<ProtectedRoute allowedRoles={['founder', 'investor']}><DealRoomPage /></ProtectedRoute>} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
