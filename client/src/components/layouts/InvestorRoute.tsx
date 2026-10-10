import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { LoaderCircle } from 'lucide-react'
import { useCurrentUser } from '@/features/auth/api'
import { useMyProfile } from '@/features/profiles/api'
import { AppHeader } from '@/components/layouts/AppHeader'

export function InvestorRoute({ children }: { children: ReactNode }) {
  const { data: user, isLoading: userLoading } = useCurrentUser()
  const profileQuery = useMyProfile(Boolean(user?.role === 'investor'))

  if (userLoading || (user?.role === 'investor' && profileQuery.isLoading)) {
    return <div className="min-h-screen bg-[#f7f8fc]"><AppHeader /><div className="flex min-h-[55vh] items-center justify-center text-sm text-slate-500" role="status"><LoaderCircle size={16} className="mr-2 animate-spin" />Loading discovery…</div></div>
  }

  if (!user) return <Navigate to="/login" replace />
  if (user.role !== 'investor') return <Navigate to="/workspace" replace />
  if (profileQuery.isError) {
    return <div className="min-h-screen bg-[#f7f8fc]"><AppHeader /><main className="flex min-h-[55vh] items-center justify-center px-5"><div className="dr-panel max-w-md p-6 text-center"><h1 className="text-lg font-semibold text-slate-950">Profile unavailable</h1><p className="mt-2 text-sm text-slate-500">The investor profile could not be loaded.</p><button onClick={() => void profileQuery.refetch()} className="dr-primary-button mx-auto mt-5">Try again</button></div></main></div>
  }
  if (!profileQuery.data?.onboardingComplete) return <Navigate to="/onboarding" replace />

  return <>{children}</>
}
