import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowRight, Building2, BriefcaseBusiness, Check, LoaderCircle, LockKeyhole, Mail, UserRound } from 'lucide-react'
import { useRegister } from '../api'
import { registerSchema, type RegisterFormData } from '../schemas'

export function RegisterForm() {
  const navigate = useNavigate()
  const registerMutation = useRegister()

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: { role: 'founder' },
  })

  const onSubmit = handleSubmit(async (data) => {
    try {
      await registerMutation.mutateAsync(data)
      navigate('/onboarding', { replace: true })
    } catch {
      // Error is displayed above the form.
    }
  })

  const busy = isSubmitting || registerMutation.isPending
  const selectedRole = watch('role')

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-5">
      {registerMutation.error && <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm leading-5 text-rose-700">{registerMutation.error.message}</div>}

      <div>
        <label htmlFor="name" className="mb-1.5 block text-sm font-semibold text-slate-700">Full name</label>
        <div className="relative"><UserRound size={16} aria-hidden="true" className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" /><input id="name" type="text" autoComplete="name" {...register('name')} className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-3 text-sm text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/10 disabled:cursor-wait disabled:bg-slate-50" disabled={busy} placeholder="Jane Smith" aria-invalid={Boolean(errors.name)} aria-describedby={errors.name ? 'name-error' : undefined} /></div>
        {errors.name && <p id="name-error" className="mt-1.5 text-xs text-rose-600">{errors.name.message}</p>}
      </div>

      <div>
        <label htmlFor="email" className="mb-1.5 block text-sm font-semibold text-slate-700">Email address</label>
        <div className="relative"><Mail size={16} aria-hidden="true" className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" /><input id="email" type="email" autoComplete="email" {...register('email')} className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-3 text-sm text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/10 disabled:cursor-wait disabled:bg-slate-50" disabled={busy} placeholder="you@example.com" aria-invalid={Boolean(errors.email)} aria-describedby={errors.email ? 'email-error' : undefined} /></div>
        {errors.email && <p id="email-error" className="mt-1.5 text-xs text-rose-600">{errors.email.message}</p>}
      </div>

      <div>
        <label htmlFor="password" className="mb-1.5 block text-sm font-semibold text-slate-700">Password</label>
        <div className="relative"><LockKeyhole size={16} aria-hidden="true" className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" /><input id="password" type="password" autoComplete="new-password" {...register('password')} className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-3 text-sm text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/10 disabled:cursor-wait disabled:bg-slate-50" disabled={busy} placeholder="At least 8 characters" aria-invalid={Boolean(errors.password)} aria-describedby={errors.password ? 'password-error' : undefined} /></div>
        {errors.password && <p id="password-error" className="mt-1.5 text-xs text-rose-600">{errors.password.message}</p>}
      </div>

      <fieldset>
        <legend className="mb-2.5 text-sm font-semibold text-slate-700">I am joining as a…</legend>
        <div className="grid grid-cols-2 gap-3">
          <label className="cursor-pointer">
            <input type="radio" value="founder" {...register('role')} className="peer sr-only" disabled={busy} />
            <span className={`dr-role-option ${selectedRole === 'founder' ? 'dr-role-option-selected' : ''}`}>
              <span className="flex items-center justify-between gap-2">
                <span className="dr-role-option-icon"><Building2 size={16} /></span>
                {selectedRole === 'founder' && <Check size={17} className="dr-role-option-check" aria-hidden="true" />}
              </span>
              <span className="text-sm font-semibold">Founder</span>
              <span className="text-xs leading-4 text-slate-500">Share your startup</span>
            </span>
          </label>
          <label className="cursor-pointer">
            <input type="radio" value="investor" {...register('role')} className="peer sr-only" disabled={busy} />
            <span className={`dr-role-option ${selectedRole === 'investor' ? 'dr-role-option-selected' : ''}`}>
              <span className="flex items-center justify-between gap-2">
                <span className="dr-role-option-icon"><BriefcaseBusiness size={16} /></span>
                {selectedRole === 'investor' && <Check size={17} className="dr-role-option-check" aria-hidden="true" />}
              </span>
              <span className="text-sm font-semibold">Investor</span>
              <span className="text-xs leading-4 text-slate-500">Explore opportunities</span>
            </span>
          </label>
        </div>
        {errors.role && <p className="mt-1.5 text-xs text-rose-600">{errors.role.message}</p>}
      </fieldset>

      <button type="submit" disabled={busy} className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-px hover:bg-indigo-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-indigo-500/20 disabled:cursor-wait disabled:opacity-60">
        {busy ? <><LoaderCircle size={16} className="animate-spin" /> Creating account…</> : <>Create account <ArrowRight size={16} /></>}
      </button>

      <p className="text-center text-sm text-slate-500">Already have an account? <Link to="/login" className="font-semibold text-indigo-700 underline-offset-4 hover:underline">Sign in</Link></p>
    </form>
  )
}
