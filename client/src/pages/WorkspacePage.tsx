import { Navigate, Link, useNavigate } from 'react-router-dom'
import { ArrowRight, BadgeCheck, Building2, Compass, LogOut, PencilLine, ShieldCheck, Sparkles, TrendingUp, Users } from 'lucide-react'
import { useCurrentUser, useLogout } from '@/features/auth/api'
import { useMyProfile } from '@/features/profiles/api'
import { ConnectionRequestsPanel } from '@/features/connections/components/ConnectionRequestsPanel'
import type { InvestorProfile, StartupProfile } from '@/types/models'

function StatCard({ label, value, description, icon: Icon }: { label: string; value: string; description: string; icon: typeof Building2 }) {
  return <div className="rounded-2xl border border-slate-200 bg-white p-5"><div className="flex items-center justify-between"><span className="text-sm font-medium text-slate-500">{label}</span><span className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 text-indigo-700"><Icon size={17} /></span></div><p className="mt-5 text-2xl font-semibold tracking-tight text-slate-950">{value}</p><p className="mt-1 text-xs leading-5 text-slate-500">{description}</p></div>
}

export function WorkspacePage() {
  const { data: user } = useCurrentUser()
  const profileQuery = useMyProfile(Boolean(user && user.role !== 'admin'))
  const logoutMutation = useLogout()
  const navigate = useNavigate()

  const handleLogout = async () => {
    try {
      await logoutMutation.mutateAsync()
      navigate('/login', { replace: true })
    } catch {
      // The session will be checked again on navigation if logout fails.
    }
  }

  if (user && user.role !== 'admin' && profileQuery.isLoading) {
    return <div className="flex min-h-screen items-center justify-center bg-slate-50 text-sm text-slate-500">Loading your workspace…</div>
  }
  if (user && user.role !== 'admin' && profileQuery.data && !profileQuery.data.onboardingComplete) {
    return <Navigate to="/onboarding" replace />
  }
  if (profileQuery.isError && user?.role !== 'admin') {
    return <div className="flex min-h-screen items-center justify-center bg-slate-50 px-5"><div className="max-w-md rounded-2xl border border-slate-200 bg-white p-6 text-center"><h1 className="text-lg font-semibold text-slate-900">Your workspace could not load</h1><p className="mt-2 text-sm text-slate-500">Check your connection and retry.</p><button onClick={() => void profileQuery.refetch()} className="mt-5 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white">Try again</button></div></div>
  }

  const startupProfile = profileQuery.data?.role === 'founder' ? profileQuery.data.profile as StartupProfile | null : null
  const investorProfile = profileQuery.data?.role === 'investor' ? profileQuery.data.profile as InvestorProfile | null : null
  const profileCompletion = profileQuery.data?.completionPercentage ?? 100
  const isFounder = user?.role === 'founder'
  const displayName = isFounder ? startupProfile?.companyName : investorProfile?.organizationName

  return (
    <div className="min-h-screen bg-[#f7f8fc] text-slate-900">
      <header className="border-b border-slate-200/80 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 sm:px-8">
          <Link to="/workspace" className="flex items-center gap-3"><span className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-950 text-white"><Building2 size={18} /></span><span className="text-lg font-semibold tracking-tight">DealRoom</span><span className="hidden rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-500 sm:inline-flex">Workspace</span></Link>
          <div className="flex items-center gap-3"><div className="hidden text-right sm:block"><p className="text-sm font-medium text-slate-800">{user?.name}</p><p className="text-xs capitalize text-slate-500">{user?.role} account</p></div><button onClick={() => void handleLogout()} disabled={logoutMutation.isPending} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50 disabled:opacity-60"><LogOut size={15} /> <span className="hidden sm:inline">Sign out</span></button></div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-5 py-8 sm:px-8 sm:py-10">
        <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end"><div><p className="text-sm font-medium text-indigo-700">Your DealRoom</p><h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">Good to have you here, {user?.name.split(' ')[0]}.</h1><p className="mt-2 text-sm leading-6 text-slate-600">This is your starting point for building meaningful startup-investor relationships.</p></div>{user?.role !== 'admin' && <Link to="/onboarding?edit=1" className="inline-flex items-center justify-center gap-2 self-start rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"><PencilLine size={15} /> Edit profile</Link>}</div>

        {user?.role === 'admin' ? <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-6"><div className="flex items-start gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-700"><ShieldCheck size={19} /></span><div><h2 className="font-semibold text-slate-900">Administrator workspace</h2><p className="mt-1 text-sm leading-6 text-slate-500">Your admin session is active. Moderation tools will be available as the platform workflow is built out.</p></div></div></div> : <>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard label="Profile status" value="Published" description="Your profile can be used in DealRoom." icon={BadgeCheck} />
            <StatCard label="Profile completeness" value={`${profileCompletion}%`} description="Based on the details saved to your profile." icon={TrendingUp} />
            <StatCard label="Account type" value={isFounder ? 'Founder' : 'Investor'} description={isFounder ? 'Startup profile and company details' : 'Investment thesis and focus areas'} icon={Users} />
            <StatCard label="Current workspace" value={displayName || 'Your profile'} description="Your profile is the foundation for discovery and deal rooms." icon={Sparkles} />
          </div>
          <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1.45fr)_minmax(300px,0.85fr)]">
            <section className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-7"><div className="flex items-start justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-400">Profile overview</p><h2 className="mt-2 text-xl font-semibold tracking-tight text-slate-950">{displayName}</h2><p className="mt-1 text-sm text-slate-500">{isFounder ? startupProfile?.tagline : investorProfile?.investorType?.replaceAll('-', ' ')}</p></div><span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">Published</span></div>
              <p className="mt-5 text-sm leading-7 text-slate-600">{isFounder ? startupProfile?.description : investorProfile?.investmentThesis}</p>
              <div className="mt-6 flex flex-wrap gap-2">{isFounder ? <><span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-600">{startupProfile?.industry}</span>{startupProfile?.stage && <span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-medium capitalize text-slate-600">{startupProfile.stage.replaceAll('-', ' ')}</span>}{startupProfile?.headquarters && <span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-600">{startupProfile.headquarters}</span>}</> : investorProfile?.sectors.slice(0, 5).map((sector) => <span key={sector} className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-600">{sector}</span>)}</div>
              <div className="mt-7 border-t border-slate-100 pt-5"><Link to="/onboarding?edit=1" className="inline-flex items-center gap-2 text-sm font-semibold text-indigo-700 transition hover:text-indigo-900">Review profile details <ArrowRight size={15} /></Link></div>
            </section>
            <section className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-7"><p className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-400">Up next</p>{user?.role === 'investor' ? <><h2 className="mt-2 text-xl font-semibold tracking-tight text-slate-950">Discover promising startups</h2><p className="mt-2 text-sm leading-6 text-slate-600">Search published company profiles, compare their stage and focus, and save interesting opportunities to your shortlist.</p><div className="mt-6 rounded-xl bg-indigo-50/70 p-4"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-indigo-700"><Compass size={18} /></span><p className="mt-3 text-sm font-semibold text-slate-900">Your discovery workspace is ready</p><p className="mt-1 text-xs leading-5 text-slate-500">Use filters and saved startups to keep your research organized.</p><Link to="/discover" className="mt-4 inline-flex items-center gap-2 rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800">Explore startups <ArrowRight size={15} /></Link></div></> : <><h2 className="mt-2 text-xl font-semibold tracking-tight text-slate-950">Build your network</h2><p className="mt-2 text-sm leading-6 text-slate-600">Your startup profile is published. Review investor introductions here and accept requests to create private Deal Rooms.</p><div className="mt-6 space-y-3">{[{ title: 'Publish a clear startup story', description: 'Keep your company, market, and traction details current.' }, { title: 'Be discoverable', description: 'Investors can now find published profiles in startup discovery.' }, { title: 'Review investor requests', description: 'Accept an introduction to automatically create a private Deal Room.' }].map((item, index) => <div key={item.title} className="flex gap-3 rounded-xl bg-slate-50 p-3.5"><span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-500">{index + 1}</span><div><p className="text-sm font-semibold text-slate-800">{item.title}</p><p className="mt-1 text-xs leading-5 text-slate-500">{item.description}</p></div></div>)}</div></>}</section>
          </div>
        </>}
        {user && (user.role === 'founder' || user.role === 'investor') && <ConnectionRequestsPanel role={user.role} />}
        <p className="mt-8 text-center text-xs text-slate-400">DealRoom · Structured conversations for startup funding</p>
      </main>
    </div>
  )
}
