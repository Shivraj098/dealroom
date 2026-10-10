import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Check, Save } from 'lucide-react'
import { useSaveInvestorProfile } from '../api'
import type { Currency, InvestorProfile, InvestorProfilePayload, StartupStage } from '@/types/models'

const sectorOptions = [
  'AI & Machine Learning', 'B2B SaaS', 'Climate & Energy', 'Consumer', 'Cybersecurity',
  'Developer Tools', 'Education', 'Fintech', 'Healthcare', 'Industrial', 'Marketplaces', 'Mobility',
]
const geographyOptions = ['Global', 'India', 'North America', 'Europe', 'Southeast Asia', 'Middle East & North Africa', 'Africa', 'Latin America']
const stageOptions: Array<{ value: StartupStage; label: string }> = [
  { value: 'idea', label: 'Idea' },
  { value: 'pre-seed', label: 'Pre-seed' },
  { value: 'seed', label: 'Seed' },
  { value: 'series-a', label: 'Series A' },
  { value: 'series-b+', label: 'Series B+' },
  { value: 'growth', label: 'Growth' },
]

interface InvestorFormState {
  organizationName: string
  investorType: InvestorProfile['investorType']
  bio: string
  investmentThesis: string
  sectors: string[]
  stages: StartupStage[]
  geographies: string[]
  minInvestment: string
  maxInvestment: string
  currency: Currency
  website: string
  linkedinUrl: string
  portfolioCompanies: string
}

function inputClass() {
  return 'mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50'
}

function numberFromInput(value: string): number | undefined {
  if (!value.trim()) return undefined
  const number = Number(value)
  return Number.isFinite(number) ? number : undefined
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return <label className="block text-sm font-medium text-slate-700">{label}{children}{hint && <span className="mt-1.5 block text-xs font-normal leading-5 text-slate-500">{hint}</span>}</label>
}

function initialValues(profile: InvestorProfile | null): InvestorFormState {
  return {
    organizationName: profile?.organizationName ?? '',
    investorType: profile?.investorType ?? '',
    bio: profile?.bio ?? '',
    investmentThesis: profile?.investmentThesis ?? '',
    sectors: profile?.sectors ?? [],
    stages: profile?.stages ?? [],
    geographies: profile?.geographies ?? [],
    minInvestment: profile?.minInvestment?.toString() ?? '',
    maxInvestment: profile?.maxInvestment?.toString() ?? '',
    currency: profile?.currency ?? 'USD',
    website: profile?.website ?? '',
    linkedinUrl: profile?.linkedinUrl ?? '',
    portfolioCompanies: profile?.portfolioCompanies.join(', ') ?? '',
  }
}

export function InvestorOnboardingForm({ profile }: { profile: InvestorProfile | null }) {
  const navigate = useNavigate()
  const saveMutation = useSaveInvestorProfile()
  const [form, setForm] = useState<InvestorFormState>(() => initialValues(profile))
  const [feedback, setFeedback] = useState('')

  const update = <K extends keyof InvestorFormState>(key: K, value: InvestorFormState[K]) => {
    setForm((current) => ({ ...current, [key]: value }))
    setFeedback('')
  }

  const toggleValue = <T extends string>(values: T[], value: T, key: 'sectors' | 'stages' | 'geographies') => {
    const next = values.includes(value) ? values.filter((item) => item !== value) : [...values, value]
    update(key, next as InvestorFormState[typeof key])
  }

  const buildPayload = (status: 'draft' | 'published'): InvestorProfilePayload => ({
    organizationName: form.organizationName,
    investorType: form.investorType,
    bio: form.bio,
    investmentThesis: form.investmentThesis,
    sectors: form.sectors,
    stages: form.stages,
    geographies: form.geographies,
    minInvestment: numberFromInput(form.minInvestment),
    maxInvestment: numberFromInput(form.maxInvestment),
    currency: form.currency,
    website: form.website,
    linkedinUrl: form.linkedinUrl,
    portfolioCompanies: form.portfolioCompanies.split(',').map((item) => item.trim()).filter(Boolean).slice(0, 30),
    status,
  })

  const save = async (status: 'draft' | 'published') => {
    setFeedback('')
    try {
      await saveMutation.mutateAsync(buildPayload(status))
      if (status === 'published') {
        navigate('/workspace', { replace: true })
      } else {
        setFeedback('Draft saved. Your profile will not be shared until you publish it.')
      }
    } catch {
      // The mutation error is displayed in the form below.
    }
  }

  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm shadow-slate-200/40">
      <div className="border-b border-slate-100 px-5 py-5 sm:px-8">
        <div className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-[0.15em] text-indigo-600">Investor setup</p><h2 className="mt-2 text-xl font-semibold tracking-tight text-slate-950">Your investment profile</h2><p className="mt-1 text-sm text-slate-500">Give founders enough context to decide whether your investment focus fits.</p></div>{profile?.status === 'published' && <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">Published</span>}</div>
      </div>
      <form onSubmit={(event) => event.preventDefault()} className="space-y-8 px-5 py-6 sm:px-8">
        {saveMutation.error && <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{saveMutation.error.message}</div>}
        {feedback && <div role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{feedback}</div>}

        <div><div className="mb-4"><h3 className="text-sm font-semibold text-slate-900">About you</h3><p className="mt-1 text-xs leading-5 text-slate-500">These details help founders understand who they would be speaking with.</p></div><div className="grid gap-5 sm:grid-cols-2">
          <Field label="Organization or investor name *"><input className={inputClass()} value={form.organizationName} onChange={(e) => update('organizationName', e.target.value)} placeholder="e.g. Northstar Ventures" /></Field>
          <Field label="Investor type *"><select className={inputClass()} value={form.investorType} onChange={(e) => update('investorType', e.target.value as InvestorProfile['investorType'])}><option value="">Select investor type</option><option value="angel">Angel investor</option><option value="venture-capital">Venture capital firm</option><option value="corporate">Corporate investor</option><option value="family-office">Family office</option><option value="accelerator">Accelerator</option><option value="other">Other</option></select></Field>
          <div className="sm:col-span-2"><Field label="Short introduction"><textarea rows={3} className={inputClass()} value={form.bio} onChange={(e) => update('bio', e.target.value)} placeholder="A little about your background or organization." /></Field></div>
          <div className="sm:col-span-2"><Field label="Investment thesis *" hint="Be specific about the problems, teams, or business models you look for."><textarea rows={4} className={inputClass()} value={form.investmentThesis} onChange={(e) => update('investmentThesis', e.target.value)} placeholder="What makes a startup interesting to you? What do you bring beyond capital?" /></Field></div>
        </div></div>

        <div className="border-t border-slate-100 pt-7"><div className="mb-4"><h3 className="text-sm font-semibold text-slate-900">Investment focus *</h3><p className="mt-1 text-xs leading-5 text-slate-500">Choose the sectors and stages that best match your current focus.</p></div>
          <p className="mb-2 text-sm font-medium text-slate-700">Sectors</p><div className="flex flex-wrap gap-2">{sectorOptions.map((sector) => <button type="button" key={sector} onClick={() => toggleValue(form.sectors, sector, 'sectors')} className={`rounded-full border px-3 py-2 text-xs font-medium transition ${form.sectors.includes(sector) ? 'border-indigo-200 bg-indigo-50 text-indigo-800' : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'}`}>{form.sectors.includes(sector) && <Check size={12} className="mr-1 inline" />}{sector}</button>)}</div>
          <p className="mb-2 mt-5 text-sm font-medium text-slate-700">Preferred stages</p><div className="flex flex-wrap gap-2">{stageOptions.map((stage) => <button type="button" key={stage.value} onClick={() => toggleValue(form.stages, stage.value, 'stages')} className={`rounded-full border px-3 py-2 text-xs font-medium transition ${form.stages.includes(stage.value) ? 'border-indigo-200 bg-indigo-50 text-indigo-800' : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'}`}>{form.stages.includes(stage.value) && <Check size={12} className="mr-1 inline" />}{stage.label}</button>)}</div>
        </div>

        <div className="border-t border-slate-100 pt-7"><div className="mb-4"><h3 className="text-sm font-semibold text-slate-900">Ticket size & geography</h3><p className="mt-1 text-xs leading-5 text-slate-500">Use approximate ranges if you prefer not to disclose exact figures.</p></div>
          <div className="grid gap-5 sm:grid-cols-3"><Field label="Minimum investment"><input type="number" min="0" className={inputClass()} value={form.minInvestment} onChange={(e) => update('minInvestment', e.target.value)} placeholder="e.g. 25000" /></Field><Field label="Maximum investment"><input type="number" min="0" className={inputClass()} value={form.maxInvestment} onChange={(e) => update('maxInvestment', e.target.value)} placeholder="e.g. 250000" /></Field><Field label="Currency"><select className={inputClass()} value={form.currency} onChange={(e) => update('currency', e.target.value as Currency)}><option value="USD">USD — US dollar</option><option value="INR">INR — Indian rupee</option><option value="EUR">EUR — Euro</option><option value="GBP">GBP — Pound sterling</option></select></Field></div>
          <p className="mb-2 mt-5 text-sm font-medium text-slate-700">Geographies</p><div className="flex flex-wrap gap-2">{geographyOptions.map((region) => <button type="button" key={region} onClick={() => toggleValue(form.geographies, region, 'geographies')} className={`rounded-full border px-3 py-2 text-xs font-medium transition ${form.geographies.includes(region) ? 'border-indigo-200 bg-indigo-50 text-indigo-800' : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'}`}>{form.geographies.includes(region) && <Check size={12} className="mr-1 inline" />}{region}</button>)}</div>
        </div>

        <div className="border-t border-slate-100 pt-7"><div className="mb-4"><h3 className="text-sm font-semibold text-slate-900">Links & portfolio</h3><p className="mt-1 text-xs leading-5 text-slate-500">Optional ways for founders to learn more about you.</p></div><div className="grid gap-5 sm:grid-cols-2">
          <Field label="Website"><input type="url" className={inputClass()} value={form.website} onChange={(e) => update('website', e.target.value)} placeholder="https://yourfirm.com" /></Field>
          <Field label="LinkedIn"><input type="url" className={inputClass()} value={form.linkedinUrl} onChange={(e) => update('linkedinUrl', e.target.value)} placeholder="https://linkedin.com/in/you" /></Field>
          <div className="sm:col-span-2"><Field label="Portfolio companies" hint="Separate names with commas; this is optional."><input className={inputClass()} value={form.portfolioCompanies} onChange={(e) => update('portfolioCompanies', e.target.value)} placeholder="Company One, Company Two, Company Three" /></Field></div>
        </div></div>

        <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:items-center sm:justify-between"><p className="max-w-lg text-xs leading-5 text-slate-500">Your profile stays a draft until you publish it. You can edit these details later.</p><div className="flex flex-col gap-2 sm:flex-row"><button type="button" onClick={() => void save('draft')} disabled={saveMutation.isPending} className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"><Save size={15} /> {saveMutation.isPending ? 'Saving…' : 'Save draft'}</button><button type="button" onClick={() => void save('published')} disabled={saveMutation.isPending} className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 disabled:opacity-60">{saveMutation.isPending ? 'Publishing…' : 'Publish profile'} <Check size={16} /></button></div></div>
      </form>
    </section>
  )
}
