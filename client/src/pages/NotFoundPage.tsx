import { ArrowLeft, ArrowRight, Compass } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { AppHeader } from '@/components/layouts/AppHeader'

export function NotFoundPage() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-[#f7f8fc] text-slate-900">
      <AppHeader />
      <main className="flex min-h-[65vh] items-center justify-center px-5 py-12">
        <section className="dr-panel w-full max-w-lg p-7 text-center sm:p-10">
          <Compass size={24} className="mx-auto text-indigo-700" aria-hidden="true" />
          <p className="dr-page-kicker mt-5">Page not found</p>
          <h1 className="mt-2 text-5xl font-semibold tracking-tight text-slate-950">404</h1>
          <p className="mx-auto mt-3 max-w-sm text-sm leading-6 text-slate-500">That address doesn't lead to a page in DealRoom.</p>
          <div className="mt-6 flex flex-wrap justify-center gap-2">
            <button type="button" onClick={() => navigate(-1)} className="dr-quiet-button"><ArrowLeft size={15} aria-hidden="true" /> Go back</button>
            <Link to="/" className="dr-primary-button">Home <ArrowRight size={15} aria-hidden="true" /></Link>
          </div>
        </section>
      </main>
    </div>
  )
}
