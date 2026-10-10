import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, ArrowUpRight, BadgeCheck, Building2, CircleDollarSign, LoaderCircle, LockKeyhole, ShieldCheck, Sparkles } from 'lucide-react'
import { useDealRoom, useUpdateDealRoomStatus } from '@/features/deal-rooms/api'
import { EvaluationPanel } from '@/features/deal-rooms/components/EvaluationPanel'
import { InformationRequestsPanel } from '@/features/deal-rooms/components/InformationRequestsPanel'
import { PrivateNotesPanel } from '@/features/deal-rooms/components/PrivateNotesPanel'
import type { DealRoomStatus } from '@/features/deal-rooms/types'

const STATUS_STYLE: Record<DealRoomStatus, string> = {
  active: 'bg-indigo-50 text-indigo-700',
  approved: 'bg-emerald-50 text-emerald-700',
  passed: 'bg-slate-100 text-slate-600',
}

export function DealRoomPage() {
  const { dealRoomId } = useParams<{ dealRoomId: string }>()
  const roomQuery = useDealRoom(dealRoomId)
  const statusMutation = useUpdateDealRoomStatus()
  const details = roomQuery.data
  const isInvestor = details?.viewerRole === 'investor'
  const readOnly = details?.room.status !== 'active'
  const otherParty = isInvestor ? details?.founder.name : details?.investor.organizationName

  function finalize(status: 'approved' | 'passed') {
    const label = status === 'approved' ? 'approve this opportunity' : 'mark this opportunity as passed'
    if (!window.confirm(`Are you sure you want to ${label}? This decision is terminal in the current workflow, and diligence edits will be disabled.`)) return
    if (dealRoomId) statusMutation.mutate({ roomId: dealRoomId, status })
  }

  if (roomQuery.isLoading) {
    return <div className="flex min-h-screen items-center justify-center bg-[#f7f8fc] text-sm text-slate-500"><LoaderCircle size={17} className="mr-2 animate-spin" /> Loading Deal Room…</div>
  }

  if (roomQuery.isError || !details) {
    return <div className="flex min-h-screen items-center justify-center bg-[#f7f8fc] px-5"><div className="max-w-md rounded-2xl border border-slate-200 bg-white p-6 text-center"><Building2 size={24} className="mx-auto text-slate-400" /><h1 className="mt-3 text-lg font-semibold text-slate-950">Deal Room unavailable</h1><p className="mt-2 text-sm leading-6 text-slate-500">This Deal Room couldn't be loaded. It may not exist, or your account may not have access to it.</p><button type="button" onClick={() => void roomQuery.refetch()} className="mt-5 rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white">Try again</button><div><Link to="/workspace" className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-indigo-700"><ArrowLeft size={14} /> Return to workspace</Link></div></div></div>
  }

  return (
    <div className="min-h-screen bg-[#f7f8fc] text-slate-900">
      <header className="border-b border-slate-200/80 bg-white"><div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-4 sm:px-8"><Link to="/workspace" className="flex items-center gap-3"><span className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-950 text-white"><Building2 size={18} /></span><span className="text-lg font-semibold tracking-tight">DealRoom</span></Link><Link to="/workspace" className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"><ArrowLeft size={14} /> Workspace</Link></div></header>
      <main className="mx-auto max-w-7xl px-5 py-7 sm:px-8 sm:py-10">
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8">
          <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-start"><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600"><LockKeyhole size={12} /> Private workspace</span><span className={`rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${STATUS_STYLE[details.room.status]}`}>{details.room.status}</span></div><p className="mt-4 text-sm font-medium text-indigo-700">Due diligence workspace</p><h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">{details.startup.companyName}</h1><p className="mt-2 max-w-3xl text-base leading-7 text-slate-600">{details.startup.tagline}</p><div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-sm text-slate-500"><span>{details.startup.industry}</span><span className="capitalize">{details.startup.stage.replaceAll('-', ' ')}</span>{details.startup.headquarters && <span>{details.startup.headquarters}</span>}</div></div>
            {isInvestor && details.room.status === 'active' && <div className="flex shrink-0 flex-col gap-2 sm:flex-row lg:flex-col"><button type="button" onClick={() => finalize('approved')} disabled={statusMutation.isPending} className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"><BadgeCheck size={15} /> Approve opportunity</button><button type="button" onClick={() => finalize('passed')} disabled={statusMutation.isPending} className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"><ArrowUpRight size={15} /> Pass on opportunity</button></div>}
          </div>
          <div className="mt-6 grid gap-3 sm:grid-cols-3"><div className="rounded-xl bg-slate-50 p-4"><span className="text-xs font-medium uppercase tracking-wide text-slate-400">Your role</span><p className="mt-2 font-semibold capitalize text-slate-900">{details.viewerRole}</p></div><div className="rounded-xl bg-slate-50 p-4"><span className="text-xs font-medium uppercase tracking-wide text-slate-400">Working with</span><p className="mt-2 font-semibold text-slate-900">{otherParty}</p></div><div className="rounded-xl bg-slate-50 p-4"><span className="text-xs font-medium uppercase tracking-wide text-slate-400">Room opened</span><p className="mt-2 font-semibold text-slate-900">{new Date(details.room.createdAt).toLocaleDateString()}</p></div></div>
          {statusMutation.isError && <p role="alert" className="mt-4 text-sm text-rose-600">{statusMutation.error instanceof Error ? statusMutation.error.message : 'The Deal Room status could not be updated.'}</p>}
          {statusMutation.isSuccess && <p role="status" className="mt-4 text-sm text-emerald-700">Deal Room status updated.</p>}
          {readOnly && <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-600"><strong className="text-slate-800">This Deal Room is finalized.</strong> Evaluation, private-note edits, and information-request changes are read-only. Existing records remain available for reference.</div>}
          {details.startup.description && <div className="mt-6 border-t border-slate-100 pt-5"><h2 className="text-sm font-semibold text-slate-900">Company overview</h2><p className="mt-2 whitespace-pre-line text-sm leading-7 text-slate-600">{details.startup.description}</p><div className="mt-4 grid gap-4 sm:grid-cols-2"><div><p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Problem</p><p className="mt-1 whitespace-pre-line text-sm leading-6 text-slate-600">{details.startup.problem || 'Not provided'}</p></div><div><p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Solution</p><p className="mt-1 whitespace-pre-line text-sm leading-6 text-slate-600">{details.startup.solution || 'Not provided'}</p></div><div><p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Target market</p><p className="mt-1 text-sm leading-6 text-slate-600">{details.startup.targetMarket || 'Not provided'}</p></div><div><p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Business model</p><p className="mt-1 text-sm leading-6 text-slate-600">{details.startup.businessModel || 'Not provided'}</p></div></div>{details.startup.website && <a href={details.startup.website} target="_blank" rel="noreferrer noopener" className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-indigo-700 underline">Company website <ArrowUpRight size={14} /></a>}</div>}
        </div>

        <div className="mt-6 grid items-start gap-6 xl:grid-cols-2">
          <InformationRequestsPanel roomId={details.room.id} role={details.viewerRole} readOnly={readOnly} />
          <div className="space-y-6">
            {isInvestor ? <><EvaluationPanel roomId={details.room.id} readOnly={readOnly} /><PrivateNotesPanel roomId={details.room.id} readOnly={readOnly} /></> : <section className="rounded-2xl border border-indigo-100 bg-indigo-50/70 p-5 sm:p-7"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-indigo-700"><ShieldCheck size={18} /></span><h2 className="mt-3 text-lg font-semibold text-indigo-950">Investor-only assessment</h2><p className="mt-2 text-sm leading-6 text-indigo-900/75">The investor’s scoring and private notes are intentionally not visible to founders. You can use this room to respond to information requests and keep shared due-diligence items up to date.</p></section>}
            <section className="rounded-2xl border border-slate-200 bg-white p-5"><div className="flex items-start gap-3"><span className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-700"><CircleDollarSign size={17} /></span><div><h2 className="font-semibold text-slate-950">Fundraising snapshot</h2><p className="mt-1 text-sm text-slate-500">Shared figures from the startup profile.</p></div></div><div className="mt-4 grid grid-cols-2 gap-3"><div className="rounded-xl bg-slate-50 p-3"><p className="text-xs text-slate-500">Funding status</p><p className="mt-1 text-sm font-semibold text-slate-900">{details.startup.fundraising.isRaising ? 'Currently raising' : 'Not raising'}</p></div><div className="rounded-xl bg-slate-50 p-3"><p className="text-xs text-slate-500">Target raise</p><p className="mt-1 text-sm font-semibold text-slate-900">{details.startup.fundraising.targetAmount == null ? 'Not shared' : `${details.startup.fundraising.currency} ${details.startup.fundraising.targetAmount.toLocaleString()}`}</p></div><div className="rounded-xl bg-slate-50 p-3"><p className="text-xs text-slate-500">Monthly revenue</p><p className="mt-1 text-sm font-semibold text-slate-900">{details.startup.traction.monthlyRevenue == null ? 'Not shared' : `${details.startup.fundraising.currency} ${details.startup.traction.monthlyRevenue.toLocaleString()}`}</p></div><div className="rounded-xl bg-slate-50 p-3"><p className="text-xs text-slate-500">Paying customers</p><p className="mt-1 text-sm font-semibold text-slate-900">{details.startup.traction.payingCustomers?.toLocaleString() ?? 'Not shared'}</p></div></div></section>
          </div>
        </div>
        <p className="mt-8 flex items-center justify-center gap-1.5 text-center text-xs text-slate-400"><Sparkles size={12} /> DealRoom keeps shared requests separate from private investor analysis.</p>
      </main>
    </div>
  )
}
