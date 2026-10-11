import { Link } from 'react-router-dom'
import { ArrowUpRight, Check, Clock3, LoaderCircle, MessageSquareText, X } from 'lucide-react'
import { useMyConnectionRequests, useRespondToConnectionRequest } from '@/features/connections/api'
import type { ConnectionRequestItem, ConnectionRequestStatus } from '@/features/connections/types'

type ConnectionRole = 'founder' | 'investor'

const STATUS_STYLES: Record<ConnectionRequestStatus, string> = {
  pending: 'bg-amber-50 text-amber-800',
  accepted: 'bg-emerald-50 text-emerald-800',
  rejected: 'bg-slate-100 text-slate-600',
}

function dateLabel(value: string): string {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Recently'
  return new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric', year: 'numeric' }).format(date)
}

function RequestCard({ item, role, isResponding, onRespond }: {
  item: ConnectionRequestItem
  role: ConnectionRole
  isResponding: boolean
  onRespond: (requestId: string, action: 'accept' | 'reject') => void
}) {
  const title = role === 'founder' ? item.investor.organizationName : item.startup.companyName
  const subtitle = role === 'founder'
    ? `${item.investor.name} · ${item.startup.companyName}`
    : [item.startup.industry, item.startup.stage.replaceAll('-', ' '), item.startup.headquarters].filter(Boolean).join(' · ')

  return (
    <article className="dr-hover-card rounded-xl border border-slate-200 bg-white p-4 sm:p-5">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-semibold text-slate-950">{title}</h3>
            <span className={`rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${STATUS_STYLES[item.status]}`}>{item.status}</span>
          </div>
          <p className="mt-1 text-xs text-slate-500">{subtitle}</p>
          <p className="mt-3 text-xs text-slate-400">Requested {dateLabel(item.createdAt)}</p>
          {item.message && <p className="mt-3 rounded-lg bg-slate-50 p-3 text-sm leading-6 text-slate-600">“{item.message}”</p>}
          {item.status === 'accepted' && item.dealRoom && <div className="mt-3 rounded-lg border border-emerald-100 bg-emerald-50/70 p-3"><p className="text-sm font-semibold text-emerald-900">Private Deal Room created</p><p className="mt-1 text-xs text-emerald-800">Room ID: <span className="font-mono">{item.dealRoom.id}</span></p><p className="mt-1 text-xs text-emerald-800">The due-diligence workspace is the next milestone.</p></div>}
          {role === 'investor' && item.status === 'rejected' && <p className="mt-3 text-xs text-slate-500">The founder declined this request. You can send a new request from the startup profile.</p>}
        </div>
        {role === 'founder' && item.status === 'pending' && <div className="flex shrink-0 gap-2 sm:flex-col">
          <button type="button" onClick={() => onRespond(item.id, 'accept')} disabled={isResponding} className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-slate-950 px-3 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-wait disabled:opacity-50"><Check size={14} /> Accept</button>
          <button type="button" onClick={() => onRespond(item.id, 'reject')} disabled={isResponding} className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:cursor-wait disabled:opacity-50"><X size={14} /> Decline</button>
        </div>}
        {role === 'investor' && <Link to={`/discover/${item.startup.id}`} className="inline-flex shrink-0 items-center justify-center gap-1.5 self-start rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">View startup <ArrowUpRight size={14} /></Link>}
      </div>
    </article>
  )
}

export function ConnectionRequestsPanel({ role }: { role: ConnectionRole }) {
  const requestsQuery = useMyConnectionRequests()
  const respondMutation = useRespondToConnectionRequest()
  const items = requestsQuery.data?.items ?? []

  function respond(requestId: string, action: 'accept' | 'reject') {
    respondMutation.mutate({ requestId, action })
  }

  return (
    <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-5 sm:p-7">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
        <div><p className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-400">Connections</p><h2 className="mt-2 text-xl font-semibold tracking-tight text-slate-950">{role === 'founder' ? 'Investor requests' : 'Your connection requests'}</h2><p className="mt-1 text-sm leading-6 text-slate-500">{role === 'founder' ? 'Review introductions from investors. Accepting a request creates a private Deal Room.' : 'Track the introductions you have requested and see when a founder responds.'}</p></div>
        <span className="inline-flex items-center gap-1.5 self-start rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600"><MessageSquareText size={13} /> {items.length} {items.length === 1 ? 'request' : 'requests'}</span>
      </div>

      {requestsQuery.isLoading ? <div className="mt-5 flex items-center gap-2 text-sm text-slate-500"><LoaderCircle size={15} className="animate-spin" /> Loading connection requests…</div>
        : requestsQuery.isError ? <div className="mt-5 rounded-xl border border-rose-200 bg-rose-50 p-4"><p className="text-sm text-rose-800">Connection requests couldn't be loaded.</p><button type="button" onClick={() => void requestsQuery.refetch()} className="mt-2 text-sm font-semibold text-rose-900 underline">Try again</button></div>
          : items.length === 0 ? <div className="mt-5 rounded-xl border border-dashed border-slate-300 bg-slate-50 px-5 py-8 text-center"><span className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-white text-slate-500"><Clock3 size={17} /></span><h3 className="mt-3 text-sm font-semibold text-slate-800">No connection requests yet</h3><p className="mt-1 text-sm text-slate-500">{role === 'founder' ? 'Requests from interested investors will appear here.' : 'Visit a startup profile to request an introduction.'}</p></div>
            : <div className="mt-5 space-y-3">{items.map((item) => <RequestCard key={item.id} item={item} role={role} isResponding={respondMutation.isPending && respondMutation.variables?.requestId === item.id} onRespond={respond} />)}</div>}

      {respondMutation.isError && <p role="alert" className="mt-4 text-sm text-rose-600">{respondMutation.error instanceof Error ? respondMutation.error.message : 'We could not update this request. Please try again.'}</p>}
    </section>
  )
}
