import { Navigate, useSearchParams } from 'react-router-dom'
import { BriefcaseBusiness, LoaderCircle } from 'lucide-react'
import { AppHeader } from '@/components/layouts/AppHeader'
import { useCurrentUser } from '@/features/auth/api'
import { useMyProfile } from '../api'
import { FounderOnboardingForm } from '../components/FounderOnboardingForm'
import { InvestorOnboardingForm } from '../components/InvestorOnboardingForm'
import type { InvestorProfile, StartupProfile } from '@/types/models'

export function OnboardingPage() {
  const { data: user } = useCurrentUser()
  const profileQuery = useMyProfile(Boolean(user && user.role !== 'admin'))
  const [searchParams] = useSearchParams()
  const editMode = searchParams.get('edit') === '1'

  if (user?.role === 'admin') return <Navigate to="/workspace" replace />
  if (profileQuery.isError) {
    return <div className="min-h-screen bg-[#f7f8fc]"><AppHeader /><main className="flex min-h-[60vh] items-center justify-center px-5"><div className="dr-panel w-full max-w-md p-6 text-center"><h1 className="text-lg font-semibold text-slate-950">Profile unavailable</h1><p className="mt-2 text-sm text-slate-500">The saved profile could not be loaded.</p><button onClick={() => void profileQuery.refetch()} className="dr-primary-button mx-auto mt-5">Try again</button></div></main></div>
  }
  if (profileQuery.isLoading || !profileQuery.data) {
    return <div className="min-h-screen bg-[#f7f8fc]"><AppHeader /><div className="flex min-h-[60vh] items-center justify-center text-sm text-slate-500" role="status"><LoaderCircle size={17} className="mr-2 animate-spin" /> Loading profile…</div></div>
  }
  if (profileQuery.data.onboardingComplete && !editMode) return <Navigate to="/workspace" replace />

  const isFounder = user?.role === 'founder'
  const profile = profileQuery.data.profile

  return (
    <div className="min-h-screen bg-[#f7f8fc] text-slate-900">
      <AppHeader />
      <main className="mx-auto max-w-7xl px-5 py-8 sm:px-8 sm:py-12">
        <div className="mb-7 max-w-3xl"><p className="dr-page-kicker">{isFounder ? 'Founder profile' : 'Investor profile'}</p><h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">{isFounder ? 'Tell investors about your startup.' : 'Set your investment focus.'}</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">{isFounder ? 'Save a draft while you work, then publish when the required details are ready.' : 'Add your thesis, focus areas, and investment range. Publish when the profile is ready.'}</p></div>
        {isFounder ? <FounderOnboardingForm profile={profile as StartupProfile | null} /> : <InvestorOnboardingForm profile={profile as InvestorProfile | null} />}
        <p className="mt-6 flex items-start gap-2 text-xs leading-5 text-slate-500"><BriefcaseBusiness size={15} className="mt-0.5 shrink-0" /><span>Only publish information you're comfortable sharing with prospective connections.</span></p>
      </main>
    </div>
  )
}
