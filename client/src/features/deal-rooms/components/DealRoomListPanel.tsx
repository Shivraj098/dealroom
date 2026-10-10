import { Link } from 'react-router-dom'
import { ArrowUpRight, Building2, LoaderCircle } from 'lucide-react'
import { useMyDealRooms } from '@/features/deal-rooms/api'
import type { DealRoomStatus } from '@/features/deal-rooms/types'

const STATUS_STYLE: Record<DealRoomStatus, string> = {
  active: 'bg-indigo-50 text-indigo-700',
  approved: 'bg-emerald-50 text-emerald-700',
  passed: 'bg-slate-100 text-slate-600',
}

export function DealRoomListPanel() {
  const roomsQuery = useMyDealRooms()
  const rooms = roomsQuery.data?.items ?? []

  return (
    <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-5 sm:p-7">
      <div className="flex items-end justify-between gap-4">
        <div><p className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-400">Due diligence</p><h2 className="mt-2 text-xl font-semibold tracking-tight text-slate-950">Your Deal Rooms</h2><p className="mt-1 text-sm leading-6 text-slate-500">Private workspaces for accepted founder–investor connections.</p></div>
        <span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600">{rooms.length} {rooms.length === 1 ? 'room' : 'rooms'}</span>
      </div>
      {roomsQuery.isLoading ? <p className="mt-5 flex items-center gap-2 text-sm text-slate-500"><LoaderCircle size={15} className="animate-spin" /> Loading Deal Rooms…</p>
        : roomsQuery.isError ? <div className="mt-5 rounded-xl border border-rose-200 bg-rose-50 p-4"><p className="text-sm text-rose-800">Deal Rooms couldn't be loaded.</p><button type="button" onClick={() => void roomsQuery.refetch()} className="mt-2 text-sm font-semibold text-rose-900 underline">Try again</button></div>
          : rooms.length === 0 ? <div className="mt-5 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center"><Building2 size={20} className="mx-auto text-slate-400" /><p className="mt-3 text-sm font-semibold text-slate-800">No Deal Rooms yet</p><p className="mt-1 text-sm text-slate-500">An accepted connection will create a private space here.</p></div>
            : <div className="mt-5 grid gap-3 md:grid-cols-2">{rooms.map((room) => <article key={room.id} className="rounded-xl border border-slate-200 p-4"><div className="flex items-start justify-between gap-3"><div className="min-w-0"><h3 className="truncate font-semibold text-slate-950">{room.startup.companyName}</h3><p className="mt-1 text-sm text-slate-500">{room.otherParty.organizationName || room.otherParty.name}</p><p className="mt-2 text-xs text-slate-400">Updated {new Date(room.updatedAt).toLocaleDateString()}</p></div><span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${STATUS_STYLE[room.status]}`}>{room.status}</span></div><p className="mt-3 line-clamp-2 text-sm leading-6 text-slate-600">{room.startup.tagline}</p><Link to={`/deal-rooms/${room.id}`} className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-indigo-700 hover:text-indigo-900">Open Deal Room <ArrowUpRight size={14} /></Link></article>)}</div>}
    </section>
  )
}
