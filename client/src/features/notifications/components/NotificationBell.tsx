import { useState } from 'react'
import { Bell, CheckCheck, LoaderCircle } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useMarkAllNotificationsRead, useMarkNotificationRead, useNotifications, useUnreadNotificationCount } from '../api'

export function NotificationBell() {
  const [open, setOpen] = useState(false)
  const navigate = useNavigate()
  const listQuery = useNotifications(open)
  const countQuery = useUnreadNotificationCount()
  const markRead = useMarkNotificationRead()
  const markAllRead = useMarkAllNotificationsRead()
  const unreadCount = countQuery.data?.unreadCount ?? listQuery.data?.unreadCount ?? 0

  function openNotification(id: string, href: string, isUnread: boolean) {
    if (isUnread) markRead.mutate(id)
    setOpen(false)
    navigate(href || '/workspace')
  }

  return (
    <div className="relative">
      <button type="button" aria-label={`Notifications${unreadCount ? `, ${unreadCount} unread` : ''}`} aria-expanded={open} onClick={() => setOpen(value => !value)} className="relative inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50">
        <Bell size={17} />
        {unreadCount > 0 && <span className="absolute -right-1 -top-1 flex min-h-5 min-w-5 items-center justify-center rounded-full bg-rose-600 px-1 text-[10px] font-bold text-white">{unreadCount > 99 ? '99+' : unreadCount}</span>}
      </button>
      {open && <div className="absolute right-0 z-50 mt-2 w-[min(22rem,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3"><div><h2 className="text-sm font-semibold text-slate-900">Notifications</h2><p className="text-xs text-slate-500">{unreadCount} unread</p></div><button type="button" onClick={() => markAllRead.mutate()} disabled={unreadCount === 0 || markAllRead.isPending} className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-700 disabled:opacity-40"><CheckCheck size={14} /> Mark all read</button></div>
        <div className="max-h-[26rem] overflow-y-auto">
          {listQuery.isLoading ? <div className="flex items-center justify-center gap-2 p-6 text-sm text-slate-500"><LoaderCircle size={15} className="animate-spin" /> Loading…</div> : listQuery.isError ? <p className="p-4 text-sm text-rose-600">Notifications couldn't be loaded.</p> : (listQuery.data?.items.length ?? 0) === 0 ? <p className="p-6 text-center text-sm text-slate-500">You're all caught up.</p> : listQuery.data?.items.map(item => <button key={item.id} type="button" onClick={() => openNotification(item.id, item.href, !item.readAt)} className={`block w-full border-b border-slate-100 px-4 py-3 text-left transition hover:bg-slate-50 ${item.readAt ? '' : 'bg-indigo-50/60'}`}><div className="flex items-start gap-2"><span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${item.readAt ? 'bg-slate-200' : 'bg-indigo-600'}`} /><span className="min-w-0 flex-1"><span className="block text-sm font-semibold text-slate-900">{item.title}</span><span className="mt-0.5 block text-xs leading-5 text-slate-600">{item.body}</span><span className="mt-1 block text-[11px] text-slate-400">{new Date(item.createdAt).toLocaleString()}</span></span></div></button>)}
        </div>
      </div>}
    </div>
  )
}
