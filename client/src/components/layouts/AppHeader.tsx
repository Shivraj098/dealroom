import { Link, useLocation, useNavigate } from 'react-router-dom'
import { ArrowUpRight, Building2, Compass, Home, LogIn, LogOut, LoaderCircle } from 'lucide-react'
import { useCurrentUser, useLogout } from '@/features/auth/api'
import { NotificationBell } from '@/features/notifications/components/NotificationBell'
import { ThemeToggle } from '@/components/theme/ThemeProvider'

function navClass(active: boolean) {
  return `dr-nav-link ${active ? 'dr-nav-link-active' : ''}`
}

export function AppHeader({ showNotifications = true }: { showNotifications?: boolean }) {
  const { data: user, isLoading } = useCurrentUser()
  const logoutMutation = useLogout()
  const location = useLocation()
  const navigate = useNavigate()

  async function handleSignOut() {
    try {
      await logoutMutation.mutateAsync()
      navigate('/', { replace: true })
    } catch {
      // The error stays visible in the header so the user can retry.
    }
  }

  return (
    <header className="dr-header sticky top-0 z-40 border-b">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-x-5 gap-y-3 px-4 py-3 sm:px-7">
        <div className="flex min-w-0 items-center gap-4">
          <Link to="/" className="dr-brand" aria-label="DealRoom home">
            <span className="dr-brand-mark"><Building2 size={18} aria-hidden="true" /></span>
            <span className="text-[17px] font-semibold tracking-tight">DealRoom</span>
          </Link>
          {user && (
            <nav aria-label="Primary navigation" className="hidden items-center gap-1 md:flex">
              <Link to="/" className={navClass(location.pathname === '/')}>Home</Link>
              <Link to="/workspace" className={navClass(location.pathname === '/workspace')}>Workspace</Link>
              {user.role === 'investor' && <Link to="/discover" className={navClass(location.pathname.startsWith('/discover'))}><Compass size={15} aria-hidden="true" /> Startups</Link>}
            </nav>
          )}
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2">
          {isLoading ? (
            <span className="hidden items-center gap-1.5 px-2 text-xs text-slate-500 sm:inline-flex" role="status"><LoaderCircle size={14} className="animate-spin" /> Loading session</span>
          ) : user ? (
            <>
              {showNotifications && <NotificationBell />}
              <div className="hidden max-w-44 border-l border-slate-200 pl-3 text-right lg:block">
                <p className="truncate text-sm font-semibold text-slate-800">{user.name}</p>
                <p className="text-[11px] capitalize text-slate-500">{user.role}</p>
              </div>
              <ThemeToggle compact />
              <button
                type="button"
                onClick={() => void handleSignOut()}
                disabled={logoutMutation.isPending}
                className="dr-signout-button"
                aria-label="Sign out of DealRoom"
                title="Sign out"
              >
                {logoutMutation.isPending ? <LoaderCircle size={16} className="animate-spin" /> : <LogOut size={16} />}
                <span className="hidden sm:inline">{logoutMutation.isPending ? 'Signing out…' : 'Sign out'}</span>
              </button>
            </>
          ) : (
            <>
              <ThemeToggle compact />
              {!isLoading && <>
                <Link to="/login" className="dr-quiet-button"><LogIn size={15} aria-hidden="true" /> Sign in</Link>
                <Link to="/register" className="dr-primary-button"><span>Create account</span><ArrowUpRight size={15} aria-hidden="true" /></Link>
              </>}
            </>
          )}
        </div>
      </div>
      {logoutMutation.isError && (
        <div className="mx-auto max-w-7xl px-4 pb-3 sm:px-7">
          <p role="alert" className="dr-error-banner">
            {logoutMutation.error instanceof Error ? logoutMutation.error.message : 'Sign out failed.'}
            <button type="button" onClick={() => void handleSignOut()} className="font-semibold underline underline-offset-2">Retry</button>
          </p>
        </div>
      )}
      {user && <div className="dr-mobile-nav border-t md:hidden"><div className="mx-auto flex max-w-7xl items-center gap-2 overflow-x-auto px-4 py-2.5 sm:px-7"><Link to="/" className={navClass(location.pathname === '/') }><Home size={14} aria-hidden="true" /> Home</Link><Link to="/workspace" className={navClass(location.pathname === '/workspace')}>Workspace</Link>{user.role === 'investor' && <Link to="/discover" className={navClass(location.pathname.startsWith('/discover'))}><Compass size={14} aria-hidden="true" /> Startups</Link>}</div></div>}
    </header>
  )
}
