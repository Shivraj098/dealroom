import { useDeferredValue, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowLeft, ArrowRight, Bookmark, BookmarkCheck, Building2, CircleDollarSign,
  LoaderCircle, MapPin, Search, SlidersHorizontal, Users, X,
} from 'lucide-react'
import { useCurrentUser } from '@/features/auth/api'
import { useSetStartupSaved, useStartupDiscovery, useStartupDiscoveryFilters } from '@/features/startups/api'
import type { StartupDiscoveryParams, DiscoverableStartup } from '@/features/startups/types'
import type { StartupStage } from '@/types/models'

const STAGE_LABELS: Record<StartupStage, string> = {
  idea: 'Idea',
  'pre-seed': 'Pre-seed',
  seed: 'Seed',
  'series-a': 'Series A',
  'series-b+': 'Series B+',
  growth: 'Growth',
}

type TeamSize = NonNullable<StartupDiscoveryParams['teamSize']>
type RaisingFilter = 'all' | 'yes' | 'no'

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

function StartupCard({
  startup,
  onToggleSaved,
  isSaving,
}: {
  startup: DiscoverableStartup
  onToggleSaved: (startup: DiscoverableStartup) => void
  isSaving: boolean
}) {
  const target = startup.fundraising.isRaising
    ? formatMoney(startup.fundraising.targetAmount, startup.fundraising.currency)
    : null

  return (
    <article className="flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-900/[0.02] transition duration-200 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-indigo-50 text-lg font-semibold text-indigo-700">
            {startup.companyName.trim().slice(0, 1).toUpperCase() || <Building2 size={20} />}
          </div>
          <div className="min-w-0">
            <h2 className="truncate font-semibold text-slate-950">{startup.companyName}</h2>
            <p className="mt-0.5 truncate text-xs text-slate-500">{startup.industry || 'Industry not specified'}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => onToggleSaved(startup)}
          disabled={isSaving}
          aria-label={startup.isSaved ? `Remove ${startup.companyName} from saved startups` : `Save ${startup.companyName}`}
          title={startup.isSaved ? 'Remove from saved' : 'Save startup'}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-slate-200 text-slate-500 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700 disabled:cursor-wait disabled:opacity-50"
        >
          {startup.isSaved ? <BookmarkCheck size={17} /> : <Bookmark size={17} />}
        </button>
      </div>

      <p className="mt-4 min-h-10 text-sm font-medium leading-5 text-slate-800">{startup.tagline || 'Building a solution for a real market need.'}</p>
      <p className="mt-2 line-clamp-3 min-h-[4.5rem] text-sm leading-6 text-slate-500">{startup.description}</p>

      <div className="mt-4 flex flex-wrap gap-2">
        {startup.stage && <span className="rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-medium text-indigo-700">{formatStage(startup.stage)}</span>}
        {startup.fundraising.isRaising && <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">Raising</span>}
      </div>

      <div className="mt-5 space-y-2 border-t border-slate-100 pt-4 text-xs text-slate-500">
        {startup.headquarters && <p className="flex items-center gap-2"><MapPin size={14} className="shrink-0" /> <span className="truncate">{startup.headquarters}</span></p>}
        {startup.teamSize && <p className="flex items-center gap-2"><Users size={14} className="shrink-0" /> Team of {startup.teamSize}</p>}
        {target && <p className="flex items-center gap-2"><CircleDollarSign size={14} className="shrink-0" /> Target raise: {target}</p>}
      </div>

      <Link to={`/discover/${startup.id}`} className="mt-5 inline-flex items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800">
        View startup <ArrowRight size={15} />
      </Link>
    </article>
  )
}

function StartupCardSkeleton() {
  return <div className="h-[340px] animate-pulse rounded-2xl border border-slate-200 bg-white p-5"><div className="h-12 w-12 rounded-2xl bg-slate-100" /><div className="mt-5 h-4 w-2/3 rounded bg-slate-100" /><div className="mt-3 h-3 w-full rounded bg-slate-100" /><div className="mt-2 h-3 w-5/6 rounded bg-slate-100" /><div className="mt-8 h-8 w-1/2 rounded-full bg-slate-100" /><div className="mt-8 h-10 w-full rounded-xl bg-slate-100" /></div>
}

export function StartupDiscoveryPage() {
  const { data: user } = useCurrentUser()
  const filtersQuery = useStartupDiscoveryFilters()
  const saveMutation = useSetStartupSaved()
  const [search, setSearch] = useState('')
  const deferredSearch = useDeferredValue(search)
  const [industry, setIndustry] = useState('')
  const [stage, setStage] = useState<StartupStage | ''>('')
  const [location, setLocation] = useState('')
  const [teamSize, setTeamSize] = useState<TeamSize | ''>('')
  const [raising, setRaising] = useState<RaisingFilter>('all')
  const [savedOnly, setSavedOnly] = useState(false)
  const [sort, setSort] = useState<StartupDiscoveryParams['sort']>('newest')
  const [page, setPage] = useState(1)

  const params = useMemo<StartupDiscoveryParams>(() => ({
    search: deferredSearch.trim() || undefined,
    industry: industry || undefined,
    stage: stage || undefined,
    location: location.trim() || undefined,
    teamSize: teamSize || undefined,
    isRaising: raising === 'all' ? undefined : raising === 'yes',
    savedOnly: savedOnly || undefined,
    page,
    limit: 9,
    sort,
  }), [deferredSearch, industry, stage, location, teamSize, raising, savedOnly, page, sort])

  const discoveryQuery = useStartupDiscovery(params)
  const results = discoveryQuery.data
  const activeFilters = Number(Boolean(industry)) + Number(Boolean(stage)) + Number(Boolean(location.trim())) + Number(Boolean(teamSize)) + Number(raising !== 'all') + Number(savedOnly)

  function clearFilters() {
    setIndustry('')
    setStage('')
    setLocation('')
    setTeamSize('')
    setRaising('all')
    setSavedOnly(false)
    setSearch('')
    setPage(1)
  }

  function toggleSaved(startup: DiscoverableStartup) {
    saveMutation.mutate({ startupId: startup.id, saved: !startup.isSaved })
  }

  return (
    <div className="min-h-screen bg-[#f7f8fc] text-slate-900">
      <header className="border-b border-slate-200/80 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-4 sm:px-8">
          <Link to="/workspace" className="flex items-center gap-3"><span className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-950 text-white"><Building2 size={18} /></span><span className="text-lg font-semibold tracking-tight">DealRoom</span></Link>
          <div className="flex items-center gap-3"><span className="hidden text-sm text-slate-500 sm:inline">Investor workspace</span><Link to="/workspace" className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50">Workspace</Link></div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-5 py-8 sm:px-8 sm:py-10">
        <Link to="/workspace" className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-slate-900"><ArrowLeft size={15} /> Back to workspace</Link>
        <div className="mt-6 flex flex-col justify-between gap-5 md:flex-row md:items-end">
          <div><p className="text-sm font-semibold text-indigo-700">Discover</p><h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">Find your next opportunity.</h1><p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">Explore published startups, learn what they are building, and save promising companies for a closer look.</p></div>
          <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600 shadow-sm"><span className="font-semibold text-slate-950">{results?.pagination.total ?? '—'}</span> published {results?.pagination.total === 1 ? 'startup' : 'startups'}</div>
        </div>

        <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm shadow-slate-900/[0.02] sm:p-5">
          <div className="flex flex-col gap-3 lg:flex-row">
            <label className="relative flex-1"><span className="sr-only">Search startups</span><Search size={17} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" /><input value={search} onChange={(event) => { setSearch(event.target.value); setPage(1) }} placeholder="Search company, product, market…" className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 text-sm outline-none transition placeholder:text-slate-400 focus:border-indigo-300 focus:bg-white focus:ring-4 focus:ring-indigo-100" /></label>
            <label className="relative lg:w-52"><span className="sr-only">Sort startups</span><SlidersHorizontal size={15} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" /><select value={sort} onChange={(event) => { setSort(event.target.value as StartupDiscoveryParams['sort']); setPage(1) }} className="h-11 w-full appearance-none rounded-xl border border-slate-200 bg-white pl-10 pr-8 text-sm text-slate-700 outline-none focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100"><option value="newest">Newest first</option><option value="recently-updated">Recently updated</option><option value="name-asc">Company name A–Z</option><option value="name-desc">Company name Z–A</option></select></label>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <label><span className="mb-1.5 block text-xs font-semibold text-slate-500">Industry</span><select value={industry} onChange={(event) => { setIndustry(event.target.value); setPage(1) }} className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100"><option value="">All industries</option>{(filtersQuery.data?.industries ?? []).map((value) => <option key={value} value={value}>{value}</option>)}</select></label>
            <label><span className="mb-1.5 block text-xs font-semibold text-slate-500">Stage</span><select value={stage} onChange={(event) => { setStage(event.target.value as StartupStage | ''); setPage(1) }} className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100"><option value="">All stages</option>{(filtersQuery.data?.stages ?? []).map((value) => <option key={value} value={value}>{formatStage(value)}</option>)}</select></label>
            <label><span className="mb-1.5 block text-xs font-semibold text-slate-500">Headquarters</span><input value={location} onChange={(event) => { setLocation(event.target.value); setPage(1) }} placeholder="City or region" className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none placeholder:text-slate-400 focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100" /></label>
            <label><span className="mb-1.5 block text-xs font-semibold text-slate-500">Team size</span><select value={teamSize} onChange={(event) => { setTeamSize(event.target.value as TeamSize | ''); setPage(1) }} className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100"><option value="">Any team size</option>{(filtersQuery.data?.teamSizes ?? []).map((value) => <option key={value} value={value}>{value} people</option>)}</select></label>
          </div>

          <div className="mt-4 flex flex-col justify-between gap-3 border-t border-slate-100 pt-4 sm:flex-row sm:items-center">
            <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
              <label className="flex items-center gap-2 text-sm text-slate-600"><input type="checkbox" checked={raising === 'yes'} onChange={(event) => { setRaising(event.target.checked ? 'yes' : 'all'); setPage(1) }} className="h-4 w-4 rounded border-slate-300 accent-indigo-600" /> Currently raising</label>
              <label className="flex items-center gap-2 text-sm text-slate-600"><input type="checkbox" checked={savedOnly} onChange={(event) => { setSavedOnly(event.target.checked); setPage(1) }} className="h-4 w-4 rounded border-slate-300 accent-indigo-600" /> Saved startups only</label>
              {activeFilters > 0 && <button onClick={clearFilters} className="inline-flex items-center gap-1 text-sm font-medium text-indigo-700 hover:text-indigo-900"><X size={14} /> Clear filters ({activeFilters})</button>}
            </div>
            <p className="text-xs text-slate-400">Signed in as {user?.name}</p>
          </div>
        </section>

        {saveMutation.isError && <div role="alert" className="mt-5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">Could not update saved startups. Please try again.</div>}
        {discoveryQuery.isError && <div role="alert" className="mt-6 rounded-2xl border border-rose-200 bg-white p-6"><h2 className="font-semibold text-slate-900">We couldn’t load startup discovery</h2><p className="mt-1 text-sm text-slate-500">Check your connection and try again.</p><button onClick={() => void discoveryQuery.refetch()} className="mt-4 rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white">Retry</button></div>}

        {discoveryQuery.isLoading && !results ? <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">{Array.from({ length: 6 }, (_, index) => <StartupCardSkeleton key={index} />)}</div> : results && <>
          <div className="mt-6 flex items-center justify-between gap-3"><p className="text-sm text-slate-600">Showing <span className="font-semibold text-slate-900">{results.items.length}</span> of <span className="font-semibold text-slate-900">{results.pagination.total}</span> startups</p>{discoveryQuery.isFetching && <span className="inline-flex items-center gap-2 text-xs text-slate-400"><LoaderCircle size={13} className="animate-spin" /> Updating results</span>}</div>
          {results.items.length === 0 ? <div className="mt-5 rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center"><span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-500"><Search size={20} /></span><h2 className="mt-4 text-lg font-semibold text-slate-900">{savedOnly ? 'No saved startups yet' : 'No startups match those filters'}</h2><p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">{savedOnly ? 'Save a startup from its card to build a shortlist you can return to later.' : 'Try a different search or clear a filter to see more companies.'}</p><button onClick={clearFilters} className="mt-5 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50">Clear filters</button></div> : <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">{results.items.map((startup) => <StartupCard key={startup.id} startup={startup} onToggleSaved={toggleSaved} isSaving={saveMutation.isPending && saveMutation.variables?.startupId === startup.id} />)}</div>}

          {results.pagination.totalPages > 1 && <nav aria-label="Startup results pages" className="mt-8 flex items-center justify-center gap-3"><button disabled={!results.pagination.hasPreviousPage} onClick={() => setPage((current) => Math.max(1, current - 1))} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"><ArrowLeft size={15} /> Previous</button><span className="text-sm text-slate-500">Page {results.pagination.page} of {results.pagination.totalPages}</span><button disabled={!results.pagination.hasNextPage} onClick={() => setPage((current) => current + 1)} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40">Next <ArrowRight size={15} /></button></nav>}
        </>}

        <p className="mt-10 text-center text-xs text-slate-400">DealRoom · A focused view of published startups, one opportunity at a time.</p>
      </main>
    </div>
  )
}
