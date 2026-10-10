import { Link, Navigate, useSearchParams } from 'react-router-dom'
import { ArrowUpRight, BriefcaseBusiness, Building2, LoaderCircle, ShieldCheck } from 'lucide-react'
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
    return <div className="flex min-h-screen items-center justify-center bg-slate-50 px-5"><div className="max-w-md rounded-2xl border border-slate-200 bg-white p-6 text-center"><h1 className="text-lg font-semibold text-slate-900">Could not load your profile</h1><p className="mt-2 text-sm text-slate-500">Check your connection and try again.</p><button onClick={() => void profileQuery.refetch()} className="mt-5 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white">Try again</button></div></div>
  }
  if (profileQuery.isLoading || !profileQuery.data) {
    return <div className="flex min-h-screen items-center justify-center bg-slate-50"><div className="flex items-center gap-3 text-sm text-slate-500"><LoaderCircle size={17} className="animate-spin" /> Loading your profile…</div></div>
  }
  if (profileQuery.data.onboardingComplete && !editMode) return <Navigate to="/workspace" replace />

  const isFounder = user?.role === 'founder'
  const profile = profileQuery.data.profile

  return (
    <div className="min-h-screen bg-[#f7f8fc] text-slate-900">
      <header className="border-b border-slate-200/80 bg-white/90">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 sm:px-8">
          <div className="flex items-center gap-3"><div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-950 text-white"><Building2 size={18} /></div><span className="text-lg font-semibold tracking-tight">DealRoom</span><span className="hidden rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-500 sm:inline-flex">Profile setup</span></div>
          <div className="flex items-center gap-3"><span className="hidden text-sm text-slate-500 sm:inline">Signed in as {user?.name}</span><Link to="/workspace" className="inline-flex items-center gap-1 text-sm font-medium text-slate-600 transition hover:text-slate-950">Workspace <ArrowUpRight size={15} /></Link></div>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-5 py-8 sm:px-8 sm:py-12">
        <div className="mb-8 max-w-3xl"><div className="mb-3 inline-flex items-center gap-2 rounded-full border border-indigo-100 bg-white px-3 py-1.5 text-xs font-semibold text-indigo-700"><ShieldCheck size={14} /> {isFounder ? 'Founder onboarding' : 'Investor onboarding'}</div><h1 className="text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">{isFounder ? 'Give your startup a strong introduction.' : 'Help founders understand how you invest.'}</h1><p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">{isFounder ? 'Build a clear profile that gives potential investors the context they need before starting a conversation. Save as you go; you can publish when you are ready.' : 'Share your investment thesis, preferred stages, and focus areas so founders can find a relevant fit. Your profile remains private as a draft until you publish.'}</p></div>
        {isFounder ? <FounderOnboardingForm profile={profile as StartupProfile | null} /> : <InvestorOnboardingForm profile={profile as InvestorProfile | null} />}
        <div className="mt-7 flex items-start gap-3 rounded-2xl border border-slate-200/80 bg-white/70 p-4 text-xs leading-5 text-slate-500"><BriefcaseBusiness size={16} className="mt-0.5 shrink-0 text-slate-400" /><p>DealRoom is for structured startup and investor introductions. Only publish information that you are comfortable sharing with prospective connections.</p></div>
      </main>
    </div>
  )
}
