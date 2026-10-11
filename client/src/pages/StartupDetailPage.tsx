import { Link, useParams } from 'react-router-dom'
import { useState } from 'react'
import type { ReactNode } from 'react'
import { ArrowLeft, Bookmark, BookmarkCheck, Building2, CalendarDays, CircleDollarSign, ExternalLink, Globe2, LoaderCircle, MapPin, TrendingUp, Users } from 'lucide-react'
import { useSetStartupSaved, useStartupDetails } from '@/features/startups/api'
import { useCreateConnectionRequest, useStartupConnectionStatus } from '@/features/connections/api'
import type { DiscoverableStartup } from '@/features/startups/types'
import { AppHeader } from '@/components/layouts/AppHeader'
import type { StartupStage } from '@/types/models'

const STAGE_LABELS: Record<StartupStage, string> = {
  idea: 'Idea',
  'pre-seed': 'Pre-seed',
  seed: 'Seed',
  'series-a': 'Series A',
  'series-b+': 'Series B+',
  growth: 'Growth',
}

function formatStage(stage: string): string {
  return STAGE_LABELS[stage as StartupStage] ?? stage
}

function formatMoney(amount: number | null, currency: string): string | null {
  if (amount === null || !Number.isFinite(amount)) return null
  try {
    return new Intl.NumberFormat(undefined, { style: 'currency', currency, maximumFractionDigits: 0 }).format(amount)
  } catch {
    return `${currency} ${amount.toLocaleString()}`
  }
}

function DetailStat({ label, value, icon: Icon }: { label: string; value: string; icon: typeof Building2 }) {
  return <div className="dr-hover-card rounded-xl border border-slate-200 bg-white p-4"><div className="flex items-center gap-2 text-xs font-medium text-slate-500"><Icon size={14} />{label}</div><p className="mt-2 text-lg font-semibold text-slate-950">{value}</p></div>
}

function DetailSection({ title, children }: { title: string; children: ReactNode }) {
  return <section className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-7"><h2 className="text-lg font-semibold tracking-tight text-slate-950">{title}</h2><div className="mt-4 text-sm leading-7 text-slate-600">{children}</div></section>
}

export function StartupDetailPage() {
  const { startupId } = useParams<{ startupId: string }>()
  const startupQuery = useStartupDetails(startupId)
  const saveMutation = useSetStartupSaved()
  const connectionStatusQuery = useStartupConnectionStatus(startupId)
  const connectionMutation = useCreateConnectionRequest()
  const startup = startupQuery.data

  if (startupQuery.isLoading) {
    return <div className="min-h-screen bg-[#f7f8fc]"><AppHeader /><div className="flex min-h-[55vh] items-center justify-center text-sm text-slate-500" role="status"><LoaderCircle size={16} className="mr-2 animate-spin" />Loading startup…</div></div>
  }

  if (startupQuery.isError || !startup) {
    return <div className="min-h-screen bg-[#f7f8fc]"><AppHeader /><main className="flex min-h-[55vh] items-center justify-center px-5"><div className="dr-panel max-w-md p-7 text-center"><Building2 size={22} className="mx-auto text-slate-400" /><h1 className="mt-4 text-xl font-semibold text-slate-950">Startup unavailable</h1><p className="mt-2 text-sm leading-6 text-slate-500">It may no longer be published, or the request may have failed.</p><button type="button" onClick={() => void startupQuery.refetch()} className="dr-primary-button mx-auto mt-5">Try again</button><Link to="/discover" className="mt-4 inline-flex text-sm font-semibold text-indigo-700">Back to discovery</Link></div></main></div>
  }

  return <StartupProfileContent
    startup={startup}
    isSaving={saveMutation.isPending}
    saveError={saveMutation.isError}
    onToggleSaved={() => saveMutation.mutate({ startupId: startup.id, saved: !startup.isSaved })}
    connectionStatus={connectionStatusQuery.data}
    connectionStatusLoading={connectionStatusQuery.isLoading}
    connectionStatusError={connectionStatusQuery.isError}
    onRetryConnectionStatus={() => void connectionStatusQuery.refetch()}
    isRequestingConnection={connectionMutation.isPending}
    connectionRequestError={connectionMutation.isError ? (connectionMutation.error instanceof Error ? connectionMutation.error.message : 'Could not send the connection request.') : null}
    onRequestConnection={async (message) => {
      if (!startupId) return
      await connectionMutation.mutateAsync({ startupId, message })
    }}
  />
}

function StartupProfileContent({ startup, isSaving, saveError, onToggleSaved, connectionStatus, connectionStatusLoading, connectionStatusError, onRetryConnectionStatus, isRequestingConnection, connectionRequestError, onRequestConnection }: {
  startup: DiscoverableStartup
  isSaving: boolean
  saveError: boolean
  onToggleSaved: () => void
  connectionStatus: import('@/features/connections/types').ConnectionRequestStatusResponse | undefined
  connectionStatusLoading: boolean
  connectionStatusError: boolean
  onRetryConnectionStatus: () => void
  isRequestingConnection: boolean
  connectionRequestError: string | null
  onRequestConnection: (message: string) => Promise<void>
}) {
  const [requestMessage, setRequestMessage] = useState('')
  const raisingTarget = startup.fundraising.isRaising ? formatMoney(startup.fundraising.targetAmount, startup.fundraising.currency) : null
  const monthlyRevenue = formatMoney(startup.traction.monthlyRevenue, startup.fundraising.currency)
  const website = startup.website.trim()
  const requestStatus = connectionStatus?.request?.status
  const hasDealRoom = Boolean(connectionStatus?.dealRoom)
  const requestIsLocked = requestStatus === 'pending' || requestStatus === 'accepted' || hasDealRoom
  const connectionButtonLabel = connectionStatusLoading ? 'Checking connection…'
    : requestStatus === 'pending' ? 'Request pending'
      : requestStatus === 'accepted' || hasDealRoom ? 'Connection accepted'
        : requestStatus === 'rejected' ? 'Request again'
          : 'Request introduction'

  return (
    <div className="min-h-screen bg-[#f7f8fc] text-slate-900">
      <AppHeader />
      <main className="mx-auto max-w-6xl px-5 py-8 sm:px-8 sm:py-10">
        <Link to="/discover" className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-slate-900"><ArrowLeft size={15} /> Back to discovery</Link>

        <section className="mt-6 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm shadow-slate-900/[0.02]">
          <div className="h-2 bg-linear-to-r from-indigo-500 via-violet-500 to-sky-400" />
          <div className="p-6 sm:p-9">
            <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex min-w-0 items-start gap-4"><div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-indigo-50 text-2xl font-semibold text-indigo-700">{startup.companyName.slice(0, 1).toUpperCase() || <Building2 size={24} />}</div><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><span className="rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-700">{startup.industry || 'Startup'}</span>{startup.stage && <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">{formatStage(startup.stage)}</span>}{startup.fundraising.isRaising && <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">Currently raising</span>}</div><h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">{startup.companyName}</h1><p className="mt-2 max-w-3xl text-base leading-7 text-slate-600">{startup.tagline}</p><div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-sm text-slate-500">{startup.headquarters && <span className="inline-flex items-center gap-1.5"><MapPin size={15} />{startup.headquarters}</span>}{startup.foundedYear && <span className="inline-flex items-center gap-1.5"><CalendarDays size={15} />Founded {startup.foundedYear}</span>}{startup.teamSize && <span className="inline-flex items-center gap-1.5"><Users size={15} />{startup.teamSize} team members</span>}</div></div></div>
              <div className="flex shrink-0 flex-col gap-3 sm:w-64">
                {!requestIsLocked && <form onSubmit={(event) => { event.preventDefault(); void onRequestConnection(requestMessage.trim()).then(() => setRequestMessage('')).catch(() => { /* Mutation error is shown below the company header. */ }) }} className="space-y-2">
                  <label htmlFor={`intro-message-${startup.id}`} className="block text-xs font-semibold text-slate-700">Message to founder <span className="font-normal text-slate-500">(optional)</span></label>
                  <textarea id={`intro-message-${startup.id}`} value={requestMessage} onChange={(event) => setRequestMessage(event.target.value)} maxLength={1000} rows={3} disabled={isRequestingConnection} placeholder="Introduce yourself and what you'd like to learn…" className="w-full resize-y rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm leading-5 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100" />
                  <p className="text-right text-[11px] text-slate-400">{requestMessage.length}/1000</p>
                  <button type="submit" disabled={connectionStatusLoading || connectionStatusError || isRequestingConnection} className="dr-primary-button w-full disabled:cursor-not-allowed disabled:opacity-60">{isRequestingConnection ? <LoaderCircle size={16} className="animate-spin" /> : null}{requestStatus === 'rejected' ? 'Send new request' : 'Request introduction'}</button>
                </form>}
                {requestIsLocked && <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm font-semibold text-slate-700" role="status">{connectionButtonLabel}</div>}
                <button onClick={onToggleSaved} disabled={isSaving} className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-60">{startup.isSaved ? <BookmarkCheck size={16} /> : <Bookmark size={16} />}{startup.isSaved ? 'Saved startup' : 'Save startup'}</button>
                {website && <a href={website} target="_blank" rel="noreferrer noopener" className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"><Globe2 size={15} /> Visit website <ExternalLink size={13} /></a>}
              </div>
            </div>
            {saveError && <p role="alert" className="mt-4 text-sm text-rose-600">We couldn't update your saved startups. Please try again.</p>}
            {connectionStatusError && <p role="alert" className="mt-3 text-sm text-rose-600">Connection status couldn't be checked. <button type="button" onClick={onRetryConnectionStatus} className="font-semibold underline">Retry</button></p>}
            {connectionRequestError && <p role="alert" className="mt-3 text-sm text-rose-600">{connectionRequestError}</p>}
            {requestStatus === 'pending' && <p className="mt-3 text-sm text-amber-700">Your introduction request is waiting for the founder to respond.</p>}
            {(requestStatus === 'accepted' || hasDealRoom) && <p className="mt-3 text-sm font-medium text-emerald-700">The founder accepted your request and a private Deal Room has been created.</p>}
            {requestStatus === 'rejected' && !hasDealRoom && <p className="mt-3 text-sm text-slate-500">Your previous request was declined. You can send a new introduction request.</p>}
          </div>
        </section>

        <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <DetailStat label="Funding status" value={startup.fundraising.isRaising ? 'Raising now' : 'Not currently raising'} icon={CircleDollarSign} />
          <DetailStat label="Target raise" value={raisingTarget ?? 'Not specified'} icon={TrendingUp} />
          <DetailStat label="Monthly active users" value={startup.traction.monthlyActiveUsers?.toLocaleString() ?? 'Not shared'} icon={Users} />
          <DetailStat label="Paying customers" value={startup.traction.payingCustomers?.toLocaleString() ?? 'Not shared'} icon={Building2} />
        </div>

        <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1.4fr)_minmax(280px,0.8fr)]">
          <div className="space-y-5">
            <DetailSection title="About the company"><p className="whitespace-pre-line">{startup.description || 'No company description has been added yet.'}</p>{startup.targetMarket && <div className="mt-5"><h3 className="font-semibold text-slate-800">Target market</h3><p className="mt-1 whitespace-pre-line">{startup.targetMarket}</p></div>}</DetailSection>
            <DetailSection title="Problem and solution"><div><h3 className="font-semibold text-slate-800">The problem</h3><p className="mt-1 whitespace-pre-line">{startup.problem || 'Not shared yet.'}</p></div><div className="mt-5"><h3 className="font-semibold text-slate-800">The solution</h3><p className="mt-1 whitespace-pre-line">{startup.solution || 'Not shared yet.'}</p></div></DetailSection>
            {startup.businessModel && <DetailSection title="Business model"><p className="whitespace-pre-line">{startup.businessModel}</p></DetailSection>}
            {startup.traction.highlights.length > 0 && <DetailSection title="Traction highlights"><ul className="space-y-2">{startup.traction.highlights.map((highlight, index) => <li key={`${highlight}-${index}`} className="flex gap-2"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-indigo-500" /><span>{highlight}</span></li>)}</ul></DetailSection>}
            {startup.teamMembers.some((member) => member.name.trim()) && <DetailSection title="Team"><div className="grid gap-3 sm:grid-cols-2">{startup.teamMembers.filter((member) => member.name.trim()).map((member) => <div key={`${member.name}-${member.title}`} className="dr-hover-card rounded-xl bg-slate-50 p-4"><p className="font-semibold text-slate-900">{member.name}</p><p className="mt-1 text-xs font-medium text-indigo-700">{member.title}</p>{member.bio && <p className="mt-2 text-sm leading-6 text-slate-500">{member.bio}</p>}</div>)}</div></DetailSection>}
          </div>

          <aside className="space-y-5">
            <DetailSection title="Fundraising"><p>{startup.fundraising.isRaising ? 'This company is currently looking to raise capital.' : 'This company is not marked as actively raising.'}</p>{raisingTarget && <div className="mt-4 rounded-xl bg-emerald-50 p-4"><p className="text-xs font-semibold uppercase tracking-wide text-emerald-800">Target amount</p><p className="mt-1 text-2xl font-semibold tracking-tight text-emerald-950">{raisingTarget}</p></div>}{startup.fundraising.amountRaised !== null && <p className="mt-3 text-sm text-slate-500">Amount raised so far: {formatMoney(startup.fundraising.amountRaised, startup.fundraising.currency)}</p>}{monthlyRevenue && <p className="mt-3 text-sm text-slate-500">Monthly revenue shared: {monthlyRevenue}</p>}</DetailSection>
            <DetailSection title="Company details"><dl className="space-y-4">{[['Industry', startup.industry], ['Stage', startup.stage ? formatStage(startup.stage) : 'Not specified'], ['Headquarters', startup.headquarters || 'Not specified'], ['Team size', startup.teamSize || 'Not specified'], ['Founded', startup.foundedYear?.toString() || 'Not specified']].map(([label, value]) => <div key={label} className="flex items-start justify-between gap-3"><dt className="text-slate-500">{label}</dt><dd className="text-right font-medium text-slate-800">{value}</dd></div>)}</dl></DetailSection>

          </aside>
        </div>
        <p className="mt-10 text-center text-xs text-slate-400">DealRoom · Startup information published by its founder.</p>
      </main>
    </div>
  )
}
