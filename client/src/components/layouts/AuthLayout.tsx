import { ArrowLeft, Building2 } from 'lucide-react'
import { Link } from 'react-router-dom'
import { ThemeToggle } from '@/components/theme/ThemeProvider'

interface AuthLayoutProps {
  title: string
  subtitle?: string
  children: React.ReactNode
}

export function AuthLayout({ title, subtitle, children }: AuthLayoutProps) {
  return (
    <div className="min-h-screen bg-[#f7f8fc] px-4 py-5 text-slate-900 sm:px-6 sm:py-8">
      <header className="mx-auto flex w-full max-w-5xl items-center justify-between gap-3">
        <Link to="/" className="dr-brand" aria-label="Return to DealRoom home">
          <span className="dr-brand-mark"><Building2 size={18} aria-hidden="true" /></span>
          <span className="text-[17px] font-semibold tracking-tight">DealRoom</span>
        </Link>
        <div className="flex items-center gap-2">
          <ThemeToggle compact />
          <Link to="/" className="dr-quiet-button"><ArrowLeft size={14} aria-hidden="true" /><span className="hidden sm:inline">Home</span></Link>
        </div>
      </header>

      <main className="mx-auto flex min-h-[calc(100vh-7rem)] w-full max-w-5xl items-center justify-center py-8 sm:py-12">
        <section className="dr-panel w-full max-w-md p-6 sm:p-8">
          <p className="dr-page-kicker">Account</p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">{title}</h1>
          {subtitle && <p className="mt-2 text-sm leading-6 text-slate-500">{subtitle}</p>}
          <div className="mt-6">{children}</div>
        </section>
      </main>
    </div>
  )
}
