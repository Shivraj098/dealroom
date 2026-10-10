import { Link } from 'react-router-dom'
import { ArrowRight, ArrowUpRight, CheckCircle2, ClipboardList, MessagesSquare } from 'lucide-react'
import { useCurrentUser } from '@/features/auth/api'
import { AppHeader } from '@/components/layouts/AppHeader'

const steps = [
  { number: '01', title: 'Introduction', description: 'Review a profile, save a prospect, or request a connection.', icon: ClipboardList },
  { number: '02', title: 'Due diligence', description: 'Keep questions, responses, notes, and messages with the deal.', icon: MessagesSquare },
  { number: '03', title: 'Decision', description: 'Move from an open evaluation to a clear outcome.', icon: CheckCircle2 },
]

export function HomePage() {
  const { data: user, isLoading } = useCurrentUser()

  return (
    <div className="min-h-screen bg-[#f7f8fc] text-slate-900">
      <AppHeader />
      <main className="mx-auto max-w-7xl px-4 pb-14 pt-10 sm:px-7 sm:pt-16 lg:pt-20">
        <section className="grid items-start gap-10 lg:grid-cols-[minmax(0,1.1fr)_minmax(350px,0.8fr)] lg:gap-16">
          <div className="pt-2">
            <p className="dr-page-kicker">A workspace for startup funding</p>
            <h1 className="mt-5 max-w-3xl text-4xl font-semibold leading-[1.08] tracking-[-0.045em] text-slate-950 sm:text-5xl lg:text-6xl">
              From first introduction to a <span className="text-indigo-700">clear decision.</span>
            </h1>
            <p className="mt-5 max-w-xl text-base leading-7 text-slate-600">
              Startup profiles, investor requests, due diligence, and conversations—kept with the deal.
            </p>
            <div className="mt-7 flex flex-wrap items-center gap-3">
              {user ? (
                <Link to="/workspace" className="dr-primary-button min-h-11 px-5">Open workspace <ArrowUpRight size={16} aria-hidden="true" /></Link>
              ) : isLoading ? (
                <span role="status" className="text-sm text-slate-500">Checking session…</span>
              ) : (
                <>
                  <Link to="/register" className="dr-primary-button min-h-11 px-5">Create account <ArrowRight size={16} aria-hidden="true" /></Link>
                  <Link to="/login" className="dr-quiet-button min-h-11 px-5">Sign in</Link>
                </>
              )}
            </div>
          </div>

          <section className="dr-home-process lg:mt-1" aria-labelledby="workflow-heading">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 id="workflow-heading" className="text-sm font-semibold text-slate-950">How a deal moves</h2>
              <span className="text-xs text-slate-500">One shared workspace</span>
            </div>
            {steps.map(({ number, title, description, icon: Icon }) => (
              <div key={number} className="dr-process-row">
                <span className="dr-process-number">{number}</span>
                <div className="min-w-0">
                  <div className="flex items-center gap-2"><Icon size={16} className="text-indigo-700" aria-hidden="true" /><h3 className="text-sm font-semibold text-slate-900">{title}</h3></div>
                  <p className="mt-1.5 text-sm leading-6 text-slate-600">{description}</p>
                </div>
              </div>
            ))}
          </section>
        </section>

        <section className="mt-14 grid gap-5 border-t border-slate-200 pt-6 sm:grid-cols-2 lg:mt-20 lg:grid-cols-3" aria-label="Who uses DealRoom">
          <div className="pr-4">
            <p className="dr-page-kicker">For founders</p>
            <p className="mt-2 text-sm leading-6 text-slate-600">Present your company, review introductions, and respond to diligence requests.</p>
          </div>
          <div className="border-slate-200 pr-4 sm:border-l sm:pl-5">
            <p className="dr-page-kicker">For investors</p>
            <p className="mt-2 text-sm leading-6 text-slate-600">Discover startups, keep a shortlist, and organize evaluation and follow-up.</p>
          </div>
          <div className="border-slate-200 pr-4 sm:border-l sm:pl-5">
            <p className="dr-page-kicker">Built around the deal</p>
            <p className="mt-2 text-sm leading-6 text-slate-600">Shared requests and messages stay separate from private investor notes.</p>
          </div>
        </section>
      </main>
    </div>
  )
}
