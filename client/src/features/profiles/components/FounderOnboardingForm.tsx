import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, ArrowRight, Check, Plus, Save, Trash2 } from 'lucide-react'
import { useSaveStartupProfile } from '../api'
import type { Currency, StartupProfile, StartupProfilePayload, StartupStage, StartupTeamMember } from '@/types/models'

const steps = [
  { title: 'Company basics', description: 'Introduce your company.' },
  { title: 'Product & market', description: 'Explain the problem and your approach.' },
  { title: 'Traction', description: 'Share any progress or early signals.' },
  { title: 'Fundraising', description: 'Tell investors what you are looking for.' },
  { title: 'Team', description: 'Add the people building the business.' },
]

interface FounderFormState {
  companyName: string
  tagline: string
  description: string
  website: string
  industry: string
  foundedYear: string
  teamSize: StartupProfile['teamSize']
  headquarters: string
  stage: StartupStage | ''
  problem: string
  solution: string
  targetMarket: string
  businessModel: string
  monthlyRevenue: string
  monthlyActiveUsers: string
  payingCustomers: string
  monthOverMonthGrowth: string
  tractionHighlights: string
  isRaising: boolean
  targetAmount: string
  amountRaised: string
  currency: Currency
  teamMembers: StartupTeamMember[]
}

function optionalNumber(value: string): number | undefined {
  if (value.trim() === '') return undefined
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : undefined
}

function initialValues(profile: StartupProfile | null): FounderFormState {
  return {
    companyName: profile?.companyName ?? '',
    tagline: profile?.tagline ?? '',
    description: profile?.description ?? '',
    website: profile?.website ?? '',
    industry: profile?.industry ?? '',
    foundedYear: profile?.foundedYear?.toString() ?? '',
    teamSize: profile?.teamSize ?? '',
    headquarters: profile?.headquarters ?? '',
    stage: profile?.stage ?? '',
    problem: profile?.problem ?? '',
    solution: profile?.solution ?? '',
    targetMarket: profile?.targetMarket ?? '',
    businessModel: profile?.businessModel ?? '',
    monthlyRevenue: profile?.traction.monthlyRevenue?.toString() ?? '',
    monthlyActiveUsers: profile?.traction.monthlyActiveUsers?.toString() ?? '',
    payingCustomers: profile?.traction.payingCustomers?.toString() ?? '',
    monthOverMonthGrowth: profile?.traction.monthOverMonthGrowth?.toString() ?? '',
    tractionHighlights: profile?.traction.highlights.join('\n') ?? '',
    isRaising: profile?.fundraising.isRaising ?? false,
    targetAmount: profile?.fundraising.targetAmount?.toString() ?? '',
    amountRaised: profile?.fundraising.amountRaised?.toString() ?? '',
    currency: profile?.fundraising.currency ?? 'USD',
    teamMembers: profile?.teamMembers.length ? profile.teamMembers.map((member) => ({ ...member })) : [{ name: '', title: '', bio: '' }],
  }
}

function textInputClass() {
  return 'mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50'
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return <label className="block text-sm font-medium text-slate-700">{label}{children}{hint && <span className="mt-1.5 block text-xs font-normal leading-5 text-slate-500">{hint}</span>}</label>
}

function TextAreaField({ label, value, onChange, placeholder, rows = 4, hint }: {
  label: string; value: string; onChange: (value: string) => void; placeholder: string; rows?: number; hint?: string
}) {
  return (
    <Field label={label} hint={hint}>
      <textarea rows={rows} value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} className={`${textInputClass()} resize-y`} />
    </Field>
  )
}

export function FounderOnboardingForm({ profile }: { profile: StartupProfile | null }) {
  const navigate = useNavigate()
  const saveMutation = useSaveStartupProfile()
  const [form, setForm] = useState<FounderFormState>(() => initialValues(profile))
  const [step, setStep] = useState(0)
  const [feedback, setFeedback] = useState('')

  const update = <K extends keyof FounderFormState>(key: K, value: FounderFormState[K]) => {
    setForm((current) => ({ ...current, [key]: value }))
    setFeedback('')
  }

  const buildPayload = (status: 'draft' | 'published'): StartupProfilePayload => ({
    companyName: form.companyName,
    tagline: form.tagline,
    description: form.description,
    website: form.website,
    industry: form.industry,
    foundedYear: optionalNumber(form.foundedYear),
    teamSize: form.teamSize,
    headquarters: form.headquarters,
    stage: form.stage,
    problem: form.problem,
    solution: form.solution,
    targetMarket: form.targetMarket,
    businessModel: form.businessModel,
    traction: {
      monthlyRevenue: optionalNumber(form.monthlyRevenue),
      monthlyActiveUsers: optionalNumber(form.monthlyActiveUsers),
      payingCustomers: optionalNumber(form.payingCustomers),
      monthOverMonthGrowth: optionalNumber(form.monthOverMonthGrowth),
      highlights: form.tractionHighlights.split('\n').map((item) => item.trim()).filter(Boolean).slice(0, 8),
    },
    fundraising: {
      isRaising: form.isRaising,
      targetAmount: optionalNumber(form.targetAmount),
      amountRaised: optionalNumber(form.amountRaised),
      currency: form.currency,
    },
    teamMembers: form.teamMembers.filter((member) => member.name.trim() || member.title.trim() || member.bio.trim()),
    status,
  })

  const save = async (status: 'draft' | 'published') => {
    setFeedback('')
    try {
      await saveMutation.mutateAsync(buildPayload(status))
      if (status === 'published') {
        navigate('/workspace', { replace: true })
      } else {
        setFeedback('Draft saved. You can come back and finish it any time.')
      }
    } catch {
      // The mutation error is displayed in the form below.
    }
  }

  const stepBody = () => {
    if (step === 0) {
      return <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Company name *"><input className={textInputClass()} value={form.companyName} onChange={(e) => update('companyName', e.target.value)} placeholder="e.g. Northstar Health" /></Field>
        <Field label="Industry *"><input className={textInputClass()} value={form.industry} onChange={(e) => update('industry', e.target.value)} placeholder="e.g. Healthcare technology" /></Field>
        <div className="sm:col-span-2"><Field label="One-line tagline *"><input className={textInputClass()} value={form.tagline} onChange={(e) => update('tagline', e.target.value)} placeholder="What do you help customers do?" maxLength={180} /></Field></div>
        <div className="sm:col-span-2"><TextAreaField label="Company overview *" value={form.description} onChange={(v) => update('description', v)} placeholder="What does your company do, and why does it matter?" rows={4} /></div>
        <Field label="Website"><input type="url" className={textInputClass()} value={form.website} onChange={(e) => update('website', e.target.value)} placeholder="https://company.com" /></Field>
        <Field label="Headquarters"><input className={textInputClass()} value={form.headquarters} onChange={(e) => update('headquarters', e.target.value)} placeholder="City, country" /></Field>
        <Field label="Founded year"><input type="number" min="1800" max={new Date().getFullYear() + 1} className={textInputClass()} value={form.foundedYear} onChange={(e) => update('foundedYear', e.target.value)} placeholder="2024" /></Field>
        <Field label="Team size"><select className={textInputClass()} value={form.teamSize} onChange={(e) => update('teamSize', e.target.value as FounderFormState['teamSize'])}><option value="">Select team size</option><option value="1-5">1–5</option><option value="6-10">6–10</option><option value="11-25">11–25</option><option value="26-50">26–50</option><option value="51-100">51–100</option><option value="100+">100+</option></select></Field>
      </div>
    }

    if (step === 1) {
      return <div className="space-y-5">
        <Field label="Current stage *"><select className={textInputClass()} value={form.stage} onChange={(e) => update('stage', e.target.value as StartupStage | '')}><option value="">Select stage</option><option value="idea">Idea</option><option value="pre-seed">Pre-seed</option><option value="seed">Seed</option><option value="series-a">Series A</option><option value="series-b+">Series B+</option><option value="growth">Growth</option></select></Field>
        <TextAreaField label="Problem *" value={form.problem} onChange={(v) => update('problem', v)} placeholder="What customer problem are you solving?" />
        <TextAreaField label="Solution *" value={form.solution} onChange={(v) => update('solution', v)} placeholder="How does your product solve it?" />
        <TextAreaField label="Target market *" value={form.targetMarket} onChange={(v) => update('targetMarket', v)} placeholder="Who are your customers? Describe your initial market." rows={3} />
        <TextAreaField label="Business model" value={form.businessModel} onChange={(v) => update('businessModel', v)} placeholder="How does the company make money?" rows={3} />
      </div>
    }

    if (step === 2) {
      return <div className="space-y-5">
        <p className="text-sm leading-6 text-slate-500">Early-stage companies are welcome. Leave anything blank that you cannot share yet.</p>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Monthly revenue"><input type="number" min="0" className={textInputClass()} value={form.monthlyRevenue} onChange={(e) => update('monthlyRevenue', e.target.value)} placeholder="0" /></Field>
          <Field label="Monthly active users"><input type="number" min="0" className={textInputClass()} value={form.monthlyActiveUsers} onChange={(e) => update('monthlyActiveUsers', e.target.value)} placeholder="0" /></Field>
          <Field label="Paying customers"><input type="number" min="0" className={textInputClass()} value={form.payingCustomers} onChange={(e) => update('payingCustomers', e.target.value)} placeholder="0" /></Field>
          <Field label="Month-over-month growth (%)"><input type="number" min="0" step="0.1" className={textInputClass()} value={form.monthOverMonthGrowth} onChange={(e) => update('monthOverMonthGrowth', e.target.value)} placeholder="e.g. 12" /></Field>
        </div>
        <TextAreaField label="Traction highlights" value={form.tractionHighlights} onChange={(v) => update('tractionHighlights', v)} placeholder={'One highlight per line\ne.g. 12 pilot customers signed'} rows={4} hint="Add up to 8 milestones, customer wins, pilots, or other signals of progress." />
      </div>
    }

    if (step === 3) {
      return <div className="space-y-5">
        <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 p-4 transition hover:border-indigo-200">
          <input type="checkbox" checked={form.isRaising} onChange={(e) => update('isRaising', e.target.checked)} className="mt-1 h-4 w-4 rounded border-slate-300 accent-indigo-600" />
          <span><span className="block text-sm font-semibold text-slate-800">We are currently raising</span><span className="mt-1 block text-xs leading-5 text-slate-500">Let potential investors know you are open to fundraising conversations.</span></span>
        </label>
        {form.isRaising && <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Target raise"><input type="number" min="0" className={textInputClass()} value={form.targetAmount} onChange={(e) => update('targetAmount', e.target.value)} placeholder="e.g. 500000" /></Field>
          <Field label="Already raised"><input type="number" min="0" className={textInputClass()} value={form.amountRaised} onChange={(e) => update('amountRaised', e.target.value)} placeholder="e.g. 100000" /></Field>
          <Field label="Currency"><select className={textInputClass()} value={form.currency} onChange={(e) => update('currency', e.target.value as Currency)}><option value="USD">USD — US dollar</option><option value="INR">INR — Indian rupee</option><option value="EUR">EUR — Euro</option><option value="GBP">GBP — Pound sterling</option></select></Field>
        </div>}
        <p className="rounded-xl bg-slate-50 p-4 text-sm leading-6 text-slate-600">You can save this section without sharing fundraising figures. Only include information you are comfortable making available to prospective investors.</p>
      </div>
    }

    return <div className="space-y-4">
      <p className="text-sm leading-6 text-slate-500">Add founders or key people. Team details are optional and can be updated later.</p>
      {form.teamMembers.map((member, index) => <div key={`member-${index}`} className="rounded-2xl border border-slate-200 p-4" >
        <div className="mb-3 flex items-center justify-between"><p className="text-sm font-semibold text-slate-800">Team member {index + 1}</p>{form.teamMembers.length > 1 && <button type="button" onClick={() => update('teamMembers', form.teamMembers.filter((_, itemIndex) => itemIndex !== index))} className="inline-flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-rose-600"><Trash2 size={14} /> Remove</button>}</div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Name"><input className={textInputClass()} value={member.name} onChange={(e) => update('teamMembers', form.teamMembers.map((item, itemIndex) => itemIndex === index ? { ...item, name: e.target.value } : item))} placeholder="Full name" /></Field>
          <Field label="Title"><input className={textInputClass()} value={member.title} onChange={(e) => update('teamMembers', form.teamMembers.map((item, itemIndex) => itemIndex === index ? { ...item, title: e.target.value } : item))} placeholder="e.g. Co-founder & CTO" /></Field>
          <div className="sm:col-span-2"><Field label="Short bio"><textarea rows={2} className={textInputClass()} value={member.bio} onChange={(e) => update('teamMembers', form.teamMembers.map((item, itemIndex) => itemIndex === index ? { ...item, bio: e.target.value } : item))} placeholder="Relevant background or experience" /></Field></div>
        </div>
      </div>)}
      <button type="button" onClick={() => update('teamMembers', [...form.teamMembers, { name: '', title: '', bio: '' }])} disabled={form.teamMembers.length >= 12} className="inline-flex items-center gap-2 rounded-xl border border-dashed border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-600 transition hover:border-indigo-300 hover:text-indigo-700 disabled:opacity-50"><Plus size={16} /> Add team member</button>
    </div>
  }

  return (
    <div className="grid gap-7 lg:grid-cols-[240px_minmax(0,1fr)]">
      <aside className="h-fit rounded-2xl border border-slate-200 bg-white p-5">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Founder setup</p>
        <div className="mt-5 space-y-3">
          {steps.map((item, index) => <button type="button" key={item.title} onClick={() => setStep(index)} className={`flex w-full items-start gap-3 rounded-xl p-3 text-left transition ${index === step ? 'bg-indigo-50' : 'hover:bg-slate-50'}`}>
            <span className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${index < step ? 'bg-indigo-600 text-white' : index === step ? 'bg-white text-indigo-700 ring-1 ring-indigo-200' : 'bg-slate-100 text-slate-500'}`}>{index < step ? <Check size={14} /> : index + 1}</span>
            <span><span className={`block text-sm font-semibold ${index === step ? 'text-indigo-950' : 'text-slate-700'}`}>{item.title}</span><span className="mt-1 block text-xs leading-5 text-slate-500">{item.description}</span></span>
          </button>)}
        </div>
        <div className="mt-5 rounded-xl bg-slate-50 p-4"><div className="flex items-center justify-between text-xs font-medium text-slate-600"><span>Profile progress</span><span>{profile?.completionPercentage ?? 0}% saved</span></div><div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-200"><div className="h-full rounded-full bg-indigo-600 transition-all" style={{ width: `${profile?.completionPercentage ?? 0}%` }} /></div><p className="mt-2 text-xs leading-5 text-slate-500">Progress updates after you save your draft.</p></div>
      </aside>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm shadow-slate-200/40">
        <div className="border-b border-slate-100 px-5 py-5 sm:px-8">
          <div className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-[0.15em] text-indigo-600">Step {step + 1} of {steps.length}</p><h2 className="mt-2 text-xl font-semibold tracking-tight text-slate-950">{steps[step].title}</h2><p className="mt-1 text-sm text-slate-500">{steps[step].description}</p></div>{profile?.status === 'published' && <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">Published</span>}</div>
        </div>
        <form onSubmit={(event) => event.preventDefault()} className="px-5 py-6 sm:px-8">
          {saveMutation.error && <div role="alert" className="mb-5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{saveMutation.error.message}</div>}
          {feedback && <div role="status" className="mb-5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{feedback}</div>}
          {stepBody()}
          <div className="mt-8 flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:items-center sm:justify-between">
            <button type="button" onClick={() => setStep((current) => Math.max(0, current - 1))} disabled={step === 0} className="inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"><ArrowLeft size={16} /> Previous</button>
            <div className="flex flex-col gap-2 sm:flex-row">
              <button type="button" onClick={() => void save('draft')} disabled={saveMutation.isPending} className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"><Save size={15} /> {saveMutation.isPending ? 'Saving…' : 'Save draft'}</button>
              {step < steps.length - 1 ? <button type="button" onClick={() => setStep((current) => Math.min(steps.length - 1, current + 1))} className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700">Continue <ArrowRight size={16} /></button> : <button type="button" onClick={() => void save('published')} disabled={saveMutation.isPending} className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 disabled:opacity-60">{saveMutation.isPending ? 'Publishing…' : 'Publish profile'} <Check size={16} /></button>}
            </div>
          </div>
        </form>
      </section>
    </div>
  )
}
