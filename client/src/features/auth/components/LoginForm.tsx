import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { ArrowRight, LoaderCircle, LockKeyhole, Mail } from 'lucide-react'
import { useLogin } from '../api'
import { loginSchema, type LoginFormData } from '../schemas'

export function LoginForm() {
  const navigate = useNavigate()
  const location = useLocation()
  const loginMutation = useLogin()

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  })

  const onSubmit = handleSubmit(async (data) => {
    try {
      await loginMutation.mutateAsync(data)
      // The workspace routes incomplete accounts to onboarding and keeps
      // completed accounts in their normal workspace.
      navigate('/workspace', { replace: true })
    } catch {
      // Error is displayed below the form heading.
    }
  })

  const busy = isSubmitting || loginMutation.isPending

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-5">
      {loginMutation.error && <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm leading-5 text-rose-700">{loginMutation.error.message}</div>}

      <div>
        <label htmlFor="email" className="mb-1.5 block text-sm font-semibold text-slate-700">Email address</label>
        <div className="relative">
          <Mail size={16} aria-hidden="true" className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input id="email" type="email" autoComplete="email" autoFocus {...register('email')} className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-3 text-sm text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/10 disabled:cursor-wait disabled:bg-slate-50" disabled={busy} placeholder="you@example.com" aria-invalid={Boolean(errors.email)} aria-describedby={errors.email ? 'email-error' : undefined} />
        </div>
        {errors.email && <p id="email-error" className="mt-1.5 text-xs text-rose-600">{errors.email.message}</p>}
      </div>

      <div>
        <label htmlFor="password" className="mb-1.5 block text-sm font-semibold text-slate-700">Password</label>
        <div className="relative">
          <LockKeyhole size={16} aria-hidden="true" className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input id="password" type="password" autoComplete="current-password" {...register('password')} className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-3 text-sm text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/10 disabled:cursor-wait disabled:bg-slate-50" disabled={busy} placeholder="Your password" aria-invalid={Boolean(errors.password)} aria-describedby={errors.password ? 'password-error' : undefined} />
        </div>
        {errors.password && <p id="password-error" className="mt-1.5 text-xs text-rose-600">{errors.password.message}</p>}
      </div>

      <button type="submit" disabled={busy} className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-px hover:bg-indigo-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-indigo-500/20 disabled:cursor-wait disabled:opacity-60">
        {busy ? <><LoaderCircle size={16} className="animate-spin" /> Signing in…</> : <>Sign in <ArrowRight size={16} /></>}
      </button>

      <p className="text-center text-sm text-slate-500">New to DealRoom? <Link to="/register" className="font-semibold text-indigo-700 underline-offset-4 hover:underline">Create an account</Link></p>
    </form>
  )
}
