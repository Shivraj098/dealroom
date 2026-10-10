import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { LoaderCircle } from 'lucide-react'
import { useCurrentUser } from '@/features/auth/api'
import { useMyProfile } from '@/features/profiles/api'
import { ProtectedRoute } from '@/components/layouts/ProtectedRoute'
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
  return <div className="flex min-h-screen items-center justify-center bg-slate-50"><div className="flex items-center gap-3 text-sm text-slate-500"><LoaderCircle size={17} className="animate-spin" />{label}</div></div>
}

/** Route authenticated users to onboarding or workspace according to saved profile state. */
function AuthGuard({ children }: { children: React.ReactNode }) {
  const { data: user, isLoading, isError } = useCurrentUser()
  const profileQuery = useMyProfile(Boolean(user && user.role !== 'admin'))

  if (isLoading) return <FullPageLoader label="Checking your session…" />
  if (isError || !user) return <>{children}</>
  if (user.role === 'admin') return <Navigate to="/workspace" replace />
  if (profileQuery.isError) {
    return <div className="flex min-h-screen items-center justify-center bg-slate-50 px-5"><div className="max-w-md rounded-2xl border border-slate-200 bg-white p-6 text-center"><h1 className="text-lg font-semibold text-slate-900">Could not load your profile</h1><p className="mt-2 text-sm text-slate-500">Try again before continuing.</p><button onClick={() => void profileQuery.refetch()} className="mt-5 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white">Try again</button></div></div>
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
