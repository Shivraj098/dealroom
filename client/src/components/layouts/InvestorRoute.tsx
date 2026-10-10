import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { LoaderCircle } from 'lucide-react'
import { useCurrentUser } from '@/features/auth/api'
import { useMyProfile } from '@/features/profiles/api'

export function InvestorRoute({ children }: { children: ReactNode }) {
  const { data: user, isLoading: userLoading } = useCurrentUser()
  const profileQuery = useMyProfile(Boolean(user?.role === 'investor'))

  if (userLoading || (user?.role === 'investor' && profileQuery.isLoading)) {
    return <div className="flex min-h-screen items-center justify-center bg-slate-50 text-sm text-slate-500"><span className="inline-flex items-center gap-2"><LoaderCircle size={16} className="animate-spin" />Preparing investor workspace…</span></div>
  }

  if (!user) return <Navigate to="/login" replace />
  if (user.role !== 'investor') return <Navigate to="/workspace" replace />
  if (profileQuery.isError) {
    return <div className="flex min-h-screen items-center justify-center bg-slate-50 px-5"><div className="max-w-md rounded-2xl border border-slate-200 bg-white p-6 text-center"><h1 className="text-lg font-semibold text-slate-900">Could not load your profile</h1><p className="mt-2 text-sm text-slate-500">Try again before continuing to discovery.</p><button onClick={() => void profileQuery.refetch()} className="mt-5 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white">Try again</button></div></div>
  }
  if (!profileQuery.data?.onboardingComplete) return <Navigate to="/onboarding" replace />

  return <>{children}</>
}
