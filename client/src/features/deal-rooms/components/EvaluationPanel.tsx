import { useState } from 'react'
import { Check, LoaderCircle, Save } from 'lucide-react'
import { useDealRoomEvaluation, useSaveDealRoomEvaluation } from '@/features/deal-rooms/api'
import type { EvaluationCategory, EvaluationScores } from '@/features/deal-rooms/types'

const CATEGORIES: Array<{ key: EvaluationCategory; label: string; description: string }> = [
  { key: 'market', label: 'Market', description: 'Market size, demand, timing, and competitive landscape.' },
  { key: 'product', label: 'Product', description: 'Product usefulness, differentiation, and defensibility.' },
  { key: 'traction', label: 'Traction', description: 'Usage, growth, customer quality, and evidence of demand.' },
  { key: 'team', label: 'Team', description: 'Founder insight, execution capability, and hiring strength.' },
  { key: 'businessModel', label: 'Business model', description: 'Pricing, unit economics, and path to sustainable revenue.' },
  { key: 'financials', label: 'Financials', description: 'Revenue quality, cash discipline, and financial assumptions.' },
  { key: 'risk', label: 'Risk', description: 'Key operational, market, regulatory, and execution risks.' },
]

export function EvaluationPanel({ roomId, readOnly }: { roomId: string; readOnly: boolean }) {
  const evaluationQuery = useDealRoomEvaluation(roomId)
  const saveMutation = useSaveDealRoomEvaluation(roomId)
  const [scoreOverrides, setScoreOverrides] = useState<EvaluationScores>({})
  const [summaryOverride, setSummaryOverride] = useState<string | undefined>(undefined)
  const scores: EvaluationScores = { ...(evaluationQuery.data?.scores ?? {}), ...scoreOverrides }
  const summary = summaryOverride ?? evaluationQuery.data?.summary ?? ''

  const hasContent = Object.values(scores).some((score) => typeof score === 'number') || summary.trim().length > 0

  function save() {
    const cleanedScores: EvaluationScores = {}
    for (const [key, value] of Object.entries(scores)) {
      if (value !== undefined) cleanedScores[key as EvaluationCategory] = value
    }
    saveMutation.mutate({ scores: cleanedScores, summary })
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-7">
      <div className="flex items-start gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-700"><Check size={18} /></span><div><h2 className="text-lg font-semibold text-slate-950">Investment evaluation</h2><p className="mt-1 text-sm leading-6 text-slate-500">Your assessment is private to your investor account and is never shown to the founder.</p></div></div>
      {evaluationQuery.isLoading ? <p className="mt-5 flex items-center gap-2 text-sm text-slate-500"><LoaderCircle size={15} className="animate-spin" /> Loading evaluation…</p>
        : evaluationQuery.isError ? <div className="mt-5 rounded-xl bg-rose-50 p-4 text-sm text-rose-800">Evaluation couldn't be loaded. <button type="button" onClick={() => void evaluationQuery.refetch()} className="font-semibold underline">Retry</button></div>
          : <>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">{CATEGORIES.map((category) => <label key={category.key} className="dr-hover-card rounded-xl border border-slate-200 p-4"><span className="block text-sm font-semibold text-slate-900">{category.label}</span><span className="mt-1 block min-h-10 text-xs leading-5 text-slate-500">{category.description}</span><select value={scores[category.key] ?? ''} disabled={readOnly} onChange={(event) => setScoreOverrides((current) => ({ ...current, [category.key]: event.target.value ? Number(event.target.value) : null }))} className="mt-3 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-indigo-500 disabled:bg-slate-50"><option value="">Not rated</option>{[1, 2, 3, 4, 5].map((score) => <option key={score} value={score}>{score} / 5{score === 1 ? ' · Weak' : score === 3 ? ' · Mixed' : score === 5 ? ' · Strong' : ''}</option>)}</select></label>)}</div>
            <label className="mt-4 block"><span className="text-sm font-semibold text-slate-800">Private summary</span><textarea value={summary} disabled={readOnly} onChange={(event) => setSummaryOverride(event.target.value)} maxLength={3000} rows={4} placeholder="Record the investment thesis, open questions, and key trade-offs…" className="mt-2 w-full rounded-xl border border-slate-200 px-3.5 py-3 text-sm leading-6 outline-none focus:border-indigo-500 disabled:bg-slate-50" /><span className="mt-1 block text-right text-xs text-slate-400">{summary.length}/3000</span></label>
            {!readOnly && <div className="mt-4 flex flex-wrap items-center gap-3"><button type="button" onClick={save} disabled={!hasContent || saveMutation.isPending} className="inline-flex items-center gap-2 rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50">{saveMutation.isPending ? <LoaderCircle size={15} className="animate-spin" /> : <Save size={15} />} Save evaluation</button>{evaluationQuery.data?.updatedAt && <span className="text-xs text-slate-400">Last saved {new Date(evaluationQuery.data.updatedAt).toLocaleString()}</span>}</div>}
            {readOnly && <p className="mt-3 text-xs text-slate-500">This Deal Room is finalized. The evaluation is read-only.</p>}
            {saveMutation.isSuccess && <p role="status" className="mt-3 text-sm text-emerald-700">Evaluation saved.</p>}
            {saveMutation.isError && <p role="alert" className="mt-3 text-sm text-rose-600">{saveMutation.error instanceof Error ? saveMutation.error.message : 'Evaluation could not be saved.'}</p>}
          </>}
    </section>
  )
}
