import { Navigate, Link } from 'react-router-dom'
import { Compass, PencilLine, ShieldCheck } from 'lucide-react'
import { useCurrentUser } from '@/features/auth/api'
import { useMyProfile } from '@/features/profiles/api'
import { ConnectionRequestsPanel } from '@/features/connections/components/ConnectionRequestsPanel'
import { DealRoomListPanel } from '@/features/deal-rooms/components/DealRoomListPanel'
import type { InvestorProfile, StartupProfile } from '@/types/models'
import { ActivityFeedPanel } from '@/features/activity/components/ActivityFeedPanel'
import { AdminManagementPanel } from '@/features/admin/components/AdminManagementPanel'
import { AppHeader } from '@/components/layouts/AppHeader'

export function WorkspacePage() {
  const { data: user } = useCurrentUser()
  const profileQuery = useMyProfile(Boolean(user && user.role !== 'admin'))

  if (user && user.role !== 'admin' && profileQuery.isLoading) {
    return <div className="min-h-screen bg-[#f7f8fc]"><AppHeader /><main className="flex min-h-[60vh] items-center justify-center px-5 text-sm text-slate-500" role="status">Loading workspace…</main></div>
  }
  if (user && user.role !== 'admin' && profileQuery.data && !profileQuery.data.onboardingComplete) {
    return <Navigate to="/onboarding" replace />
  }
  if (profileQuery.isError && user?.role !== 'admin') {
    return (
      <div className="min-h-screen bg-[#f7f8fc] text-slate-900">
        <AppHeader />
        <main className="mx-auto flex max-w-7xl justify-center px-4 py-12 sm:px-7">
          <section className="dr-panel w-full max-w-md p-6 text-center sm:p-8">
            <h1 className="text-xl font-semibold tracking-tight text-slate-950">Profile unavailable</h1>
            <p className="mt-2 text-sm leading-6 text-slate-500">Your session is active, but the profile couldn't be loaded.</p>
            <button type="button" onClick={() => void profileQuery.refetch()} className="dr-primary-button mx-auto mt-5">Try again</button>
          </section>
        </main>
      </div>
    )
  }

  const startupProfile = profileQuery.data?.role === 'founder' ? profileQuery.data.profile as StartupProfile | null : null
  const investorProfile = profileQuery.data?.role === 'investor' ? profileQuery.data.profile as InvestorProfile | null : null
  const profileCompletion = profileQuery.data?.completionPercentage ?? 100
  const isFounder = user?.role === 'founder'
  const displayName = isFounder ? startupProfile?.companyName : investorProfile?.organizationName
  const profileStatus = isFounder
    ? startupProfile?.moderationStatus === 'hidden' ? 'Hidden' : startupProfile?.status === 'published' ? 'Published' : 'Draft'
    : investorProfile?.status === 'published' ? 'Published' : 'Draft'

  return (
    <div className="min-h-screen bg-[#f7f8fc] text-slate-900">
      <AppHeader showNotifications />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-7 sm:py-10">
        <div className="flex flex-col justify-between gap-4 border-b border-slate-200 pb-6 sm:flex-row sm:items-end">
          <div>
            <p className="dr-page-kicker">{user?.role === 'admin' ? 'Platform' : isFounder ? 'Founder workspace' : 'Investor workspace'}</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">{user?.role === 'admin' ? 'Administration' : 'Workspace'}</h1>
            <p className="mt-2 text-sm text-slate-600">{user?.role === 'admin' ? 'Manage accounts and startup visibility.' : isFounder ? 'Your startup, investor requests, and active deals.' : 'Your startup shortlist, conversations, and deal reviews.'}</p>
          </div>
        </div>

        {user?.role === 'admin' ? (
          <div className="mt-7"><AdminManagementPanel /></div>
        ) : (
          <>
            <section className="dr-panel mt-6 p-5 sm:p-7" aria-labelledby="profile-overview-heading">
              <div className="flex flex-col justify-between gap-5 md:flex-row md:items-start">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="dr-page-kicker">Profile</p>
                    <span className={`dr-status ${profileStatus === 'Published' ? 'dr-status-good' : profileStatus === 'Hidden' ? 'dr-status-danger' : 'dr-status-neutral'}`}>{profileStatus}</span>
                  </div>
                  <h2 id="profile-overview-heading" className="mt-2 text-xl font-semibold tracking-tight text-slate-950">{displayName || 'Complete your profile'}</h2>
                  {((isFounder && startupProfile?.tagline) || (!isFounder && investorProfile?.investorType)) && <p className="mt-1 text-sm text-slate-500">{isFounder ? startupProfile?.tagline : investorProfile?.investorType?.replaceAll('-', ' ')}</p>}
                  <p className="mt-4 max-w-3xl text-sm leading-6 text-slate-600">{isFounder ? startupProfile?.description : investorProfile?.investmentThesis}</p>
                  <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-sm text-slate-500">
                    {isFounder ? <>
                      {startupProfile?.industry && <span>{startupProfile.industry}</span>}
                      {startupProfile?.stage && <span className="capitalize">{startupProfile.stage.replaceAll('-', ' ')}</span>}
                      {startupProfile?.headquarters && <span>{startupProfile.headquarters}</span>}
                    </> : investorProfile?.sectors.slice(0, 5).map(sector => <span key={sector}>{sector}</span>)}
                  </div>
                </div>
                <Link to="/onboarding?edit=1" className="dr-quiet-button shrink-0"><PencilLine size={15} aria-hidden="true" /> Edit profile</Link>
              </div>
              {isFounder && startupProfile?.moderationStatus === 'hidden' && <div className="mt-5 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800"><p className="font-semibold">Not visible in discovery</p><p className="mt-1">{startupProfile.moderationReason || 'An administrator has hidden this listing.'}</p></div>}
              {profileCompletion < 100 && <div className="mt-6 border-t border-slate-200 pt-5">
                <div className="flex flex-wrap items-center justify-between gap-2"><p className="text-sm font-semibold text-slate-800">Profile completeness</p><span className="text-sm font-semibold text-slate-800">{profileCompletion}%</span></div>
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-slate-950 transition-all" style={{ width: `${profileCompletion}%` }} /></div>
                <p className="mt-2 text-xs text-slate-500">Add missing details to make your profile more useful to the other side.</p>
              </div>}
            </section>

            <div className="mt-7 flex flex-col justify-between gap-4 border-b border-slate-200 pb-5 sm:flex-row sm:items-center">
              <div><h2 className="text-lg font-semibold text-slate-950">Your deal activity</h2><p className="mt-1 text-sm text-slate-500">Requests, rooms, and recent updates.</p></div>
              {user?.role === 'investor' && <Link to="/discover" className="dr-primary-button self-start">Explore startups <Compass size={15} aria-hidden="true" /></Link>}
              {user?.role === 'founder' && <span className="inline-flex items-center gap-2 text-sm text-slate-500"><ShieldCheck size={15} aria-hidden="true" /> Requests you accept open a private Deal Room.</span>}
            </div>
            <div className="mt-6 grid items-start gap-7 xl:grid-cols-[minmax(0,1.25fr)_minmax(300px,0.75fr)]">
              <div className="min-w-0 space-y-7">
                <DealRoomListPanel />
                <ConnectionRequestsPanel role={user!.role as 'founder' | 'investor'} />
              </div>
              <div className="min-w-0"><ActivityFeedPanel /></div>
            </div>
          </>
        )}
      </main>
    </div>
  )
}
