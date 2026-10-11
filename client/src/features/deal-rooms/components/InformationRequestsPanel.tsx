import { useState } from 'react'
import { FileQuestion, ExternalLink, LoaderCircle, Plus, Send, CheckCircle2 } from 'lucide-react'
import {
  useCloseInformationRequest,
  useCreateInformationRequest,
  useInformationRequests,
  useRespondInformationRequest,
} from '@/features/deal-rooms/api'
import type { InformationRequest, InformationRequestStatus, RoomRole } from '@/features/deal-rooms/types'

const STATUS_STYLE: Record<InformationRequestStatus, string> = {
  open: 'bg-amber-50 text-amber-800',
  responded: 'bg-emerald-50 text-emerald-800',
  closed: 'bg-slate-100 text-slate-600',
}

function ResponseForm({ item, roomId, readOnly }: { item: InformationRequest; roomId: string; readOnly: boolean }) {
  const respondMutation = useRespondInformationRequest(roomId)
  const [responseText, setResponseText] = useState(item.responseText)
  const [responseLink, setResponseLink] = useState(item.responseLink)

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    respondMutation.mutate({ requestId: item.id, responseText: responseText.trim(), responseLink: responseLink.trim() })
  }

  if (item.status === 'closed' || readOnly) {
    return item.responseText ? <div className="mt-4 rounded-xl bg-slate-50 p-4"><p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Founder response</p><p className="mt-2 whitespace-pre-line text-sm leading-6 text-slate-700">{item.responseText}</p>{item.responseLink && <a href={item.responseLink} target="_blank" rel="noreferrer noopener" className="mt-2 inline-flex items-center gap-1.5 text-sm font-semibold text-indigo-700 underline">Open attached link <ExternalLink size={13} /></a>}</div> : null
  }

  return <form onSubmit={submit} className="mt-4 rounded-xl bg-slate-50 p-4"><label className="block text-sm font-medium text-slate-700">Response<textarea value={responseText} onChange={(event) => setResponseText(event.target.value)} maxLength={5000} rows={3} required placeholder="Respond with the requested information…" className="mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm leading-6 outline-none focus:border-indigo-500" /></label><label className="mt-3 block text-sm font-medium text-slate-700">Optional supporting link<input type="url" value={responseLink} onChange={(event) => setResponseLink(event.target.value)} maxLength={1000} placeholder="https://…" className="mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-indigo-500" /></label><button type="submit" disabled={!responseText.trim() || respondMutation.isPending} className="mt-3 inline-flex items-center gap-2 rounded-lg bg-slate-950 px-3.5 py-2 text-sm font-semibold text-white disabled:opacity-50">{respondMutation.isPending ? <LoaderCircle size={14} className="animate-spin" /> : <Send size={14} />} {item.status === 'responded' ? 'Update response' : 'Send response'}</button>{respondMutation.isError && <p role="alert" className="mt-2 text-sm text-rose-600">{respondMutation.error instanceof Error ? respondMutation.error.message : 'Response could not be saved.'}</p>}</form>
}

export function InformationRequestsPanel({ roomId, role, readOnly }: { roomId: string; role: RoomRole; readOnly: boolean }) {
  const requestsQuery = useInformationRequests(roomId)
  const createMutation = useCreateInformationRequest(roomId)
  const closeMutation = useCloseInformationRequest(roomId)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const items = requestsQuery.data?.items ?? []

  function create(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    createMutation.mutate({ title: title.trim(), description: description.trim() }, {
      onSuccess: () => { setTitle(''); setDescription('') },
    })
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-7">
      <div className="flex items-start gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-50 text-sky-700"><FileQuestion size={18} /></span><div><h2 className="text-lg font-semibold text-slate-950">Information requests</h2><p className="mt-1 text-sm leading-6 text-slate-500">Keep due-diligence questions and founder responses organized in one place.</p></div></div>
      {role === 'investor' && !readOnly && <form onSubmit={create} className="mt-5 rounded-xl bg-slate-50 p-4"><label className="block text-sm font-medium text-slate-700">Request title<input value={title} onChange={(event) => setTitle(event.target.value)} maxLength={120} required placeholder="e.g. Customer retention for the last 12 months" className="mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-indigo-500" /></label><label className="mt-3 block text-sm font-medium text-slate-700">What information is needed?<textarea value={description} onChange={(event) => setDescription(event.target.value)} maxLength={2000} required rows={3} placeholder="Explain the question or evidence you need from the founder…" className="mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm leading-6 outline-none focus:border-indigo-500" /></label><button type="submit" disabled={!title.trim() || !description.trim() || createMutation.isPending} className="mt-3 inline-flex items-center gap-2 rounded-lg bg-slate-950 px-3.5 py-2 text-sm font-semibold text-white disabled:opacity-50">{createMutation.isPending ? <LoaderCircle size={14} className="animate-spin" /> : <Plus size={14} />} Send information request</button>{createMutation.isError && <p role="alert" className="mt-2 text-sm text-rose-600">{createMutation.error instanceof Error ? createMutation.error.message : 'Request could not be created.'}</p>}</form>}
      {requestsQuery.isLoading ? <p className="mt-5 flex items-center gap-2 text-sm text-slate-500"><LoaderCircle size={15} className="animate-spin" /> Loading information requests…</p>
        : requestsQuery.isError ? <div className="mt-5 rounded-xl bg-rose-50 p-4 text-sm text-rose-800">Information requests couldn't be loaded. <button type="button" onClick={() => void requestsQuery.refetch()} className="font-semibold underline">Retry</button></div>
          : items.length === 0 ? <div className="mt-5 rounded-xl border border-dashed border-slate-300 p-6 text-center"><FileQuestion size={20} className="mx-auto text-slate-400" /><p className="mt-3 text-sm font-semibold text-slate-800">No information requests yet</p><p className="mt-1 text-sm text-slate-500">{role === 'investor' ? 'Create a request when you need additional details from the founder.' : 'Investor questions will appear here for you to answer.'}</p></div>
            : <div className="mt-5 space-y-3">{items.map((item) => <article key={item.id} className="dr-hover-card rounded-xl border border-slate-200 p-4"><div className="flex flex-wrap items-start justify-between gap-3"><div className="min-w-0"><h3 className="font-semibold text-slate-950">{item.title}</h3><p className="mt-2 whitespace-pre-line text-sm leading-6 text-slate-600">{item.description}</p><p className="mt-2 text-xs text-slate-400">Requested {new Date(item.createdAt).toLocaleDateString()}</p></div><span className={`rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${STATUS_STYLE[item.status]}`}>{item.status}</span></div>{role === 'founder' && <ResponseForm key={`${item.id}:${item.updatedAt}`} item={item} roomId={roomId} readOnly={readOnly} />}{role === 'investor' && item.responseText && <div className="mt-4 rounded-xl bg-slate-50 p-4"><p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Founder response</p><p className="mt-2 whitespace-pre-line text-sm leading-6 text-slate-700">{item.responseText}</p>{item.responseLink && <a href={item.responseLink} target="_blank" rel="noreferrer noopener" className="mt-2 inline-flex items-center gap-1.5 text-sm font-semibold text-indigo-700 underline">Open attached link <ExternalLink size={13} /></a>}</div>}{role === 'investor' && !readOnly && item.status !== 'closed' && <button type="button" onClick={() => closeMutation.mutate(item.id)} disabled={closeMutation.isPending} className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-50"><CheckCircle2 size={13} /> Close request</button>}</article>)}</div>}
      {closeMutation.isError && <p role="alert" className="mt-3 text-sm text-rose-600">{closeMutation.error instanceof Error ? closeMutation.error.message : 'Request could not be closed.'}</p>}
      {closeMutation.isSuccess && <p role="status" className="mt-3 text-sm text-emerald-700">Information request updated.</p>}
      {readOnly && <p className="mt-3 text-xs text-slate-500">This Deal Room is finalized. Information requests are read-only.</p>}
    </section>
  )
}
