import { useState } from 'react'
import { BookOpenText, LoaderCircle, Pencil, Plus, Save, Trash2, X } from 'lucide-react'
import { useCreatePrivateNote, useDeletePrivateNote, usePrivateNotes, useUpdatePrivateNote } from '@/features/deal-rooms/api'
import type { PrivateNote } from '@/features/deal-rooms/types'

export function PrivateNotesPanel({ roomId, readOnly }: { roomId: string; readOnly: boolean }) {
  const notesQuery = usePrivateNotes(roomId)
  const createMutation = useCreatePrivateNote(roomId)
  const updateMutation = useUpdatePrivateNote(roomId)
  const deleteMutation = useDeletePrivateNote(roomId)
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [editContent, setEditContent] = useState('')
  const notes = notesQuery.data?.items ?? []

  function createNote(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    createMutation.mutate({ title: title.trim(), content: content.trim() }, {
      onSuccess: () => { setTitle(''); setContent('') },
    })
  }

  function beginEdit(note: PrivateNote) {
    setEditingId(note.id)
    setEditTitle(note.title)
    setEditContent(note.content)
  }

  function saveEdit(noteId: string) {
    updateMutation.mutate({ noteId, title: editTitle.trim(), content: editContent.trim() }, {
      onSuccess: () => setEditingId(null),
    })
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-7">
      <div className="flex items-start gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-700"><BookOpenText size={18} /></span><div><h2 className="text-lg font-semibold text-slate-950">Private investor notes</h2><p className="mt-1 text-sm leading-6 text-slate-500">Only you can view these notes. They are never shared with the founder or other investors.</p></div></div>
      {!readOnly && <form onSubmit={createNote} className="mt-5 rounded-xl bg-slate-50 p-4"><label className="block text-sm font-medium text-slate-700">Note title<input value={title} onChange={(event) => setTitle(event.target.value)} maxLength={120} required placeholder="e.g. Customer concentration risk" className="mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-indigo-500" /></label><label className="mt-3 block text-sm font-medium text-slate-700">Details<textarea value={content} onChange={(event) => setContent(event.target.value)} maxLength={5000} required rows={3} placeholder="Capture observations, questions, or follow-up ideas…" className="mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm leading-6 outline-none focus:border-indigo-500" /></label><button type="submit" disabled={!title.trim() || !content.trim() || createMutation.isPending} className="mt-3 inline-flex items-center gap-2 rounded-lg bg-slate-950 px-3.5 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50">{createMutation.isPending ? <LoaderCircle size={14} className="animate-spin" /> : <Plus size={14} />} Add private note</button></form>}
      {notesQuery.isLoading ? <p className="mt-5 flex items-center gap-2 text-sm text-slate-500"><LoaderCircle size={15} className="animate-spin" /> Loading notes…</p>
        : notesQuery.isError ? <div className="mt-5 rounded-xl bg-rose-50 p-4 text-sm text-rose-800">Private notes couldn't be loaded. <button type="button" onClick={() => void notesQuery.refetch()} className="font-semibold underline">Retry</button></div>
          : notes.length === 0 ? <div className="mt-4 rounded-xl border border-dashed border-slate-300 p-5 text-center text-sm text-slate-500">No private notes yet. Add observations you want to keep for your own review.</div>
            : <div className="mt-4 space-y-3">{notes.map((note) => <article key={note.id} className="rounded-xl border border-slate-200 p-4">{editingId === note.id ? <><input value={editTitle} onChange={(event) => setEditTitle(event.target.value)} maxLength={120} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold outline-none focus:border-indigo-500" /><textarea value={editContent} onChange={(event) => setEditContent(event.target.value)} maxLength={5000} rows={4} className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm leading-6 outline-none focus:border-indigo-500" /><div className="mt-3 flex gap-2"><button type="button" onClick={() => saveEdit(note.id)} disabled={!editTitle.trim() || !editContent.trim() || updateMutation.isPending} className="inline-flex items-center gap-1.5 rounded-lg bg-slate-950 px-3 py-2 text-xs font-semibold text-white disabled:opacity-50"><Save size={13} /> Save</button><button type="button" onClick={() => setEditingId(null)} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600"><X size={13} /> Cancel</button></div></> : <><div className="flex items-start justify-between gap-3"><h3 className="font-semibold text-slate-900">{note.title}</h3>{!readOnly && <div className="flex shrink-0 gap-1"><button type="button" aria-label={`Edit ${note.title}`} onClick={() => beginEdit(note)} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-900"><Pencil size={14} /></button><button type="button" aria-label={`Delete ${note.title}`} onClick={() => deleteMutation.mutate(note.id)} disabled={deleteMutation.isPending} className="rounded-lg p-2 text-slate-500 hover:bg-rose-50 hover:text-rose-700 disabled:opacity-50"><Trash2 size={14} /></button></div>}</div><p className="mt-2 whitespace-pre-line text-sm leading-6 text-slate-600">{note.content}</p><p className="mt-3 text-xs text-slate-400">Updated {new Date(note.updatedAt).toLocaleString()}</p></>}</article>)}</div>}
      {(createMutation.isError || updateMutation.isError || deleteMutation.isError) && <p role="alert" className="mt-3 text-sm text-rose-600">{[createMutation.error, updateMutation.error, deleteMutation.error].find((error) => error instanceof Error)?.message ?? 'The private note could not be saved.'}</p>}
      {createMutation.isSuccess && <p role="status" className="mt-3 text-sm text-emerald-700">Private note saved.</p>}
      {readOnly && <p className="mt-3 text-xs text-slate-500">This Deal Room is finalized. Your notes remain private and read-only.</p>}
    </section>
  )
}
