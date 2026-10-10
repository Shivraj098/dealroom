import { useNavigate } from 'react-router-dom'
import { useCurrentUser, useLogout } from '@/features/auth/api'

export function WorkspacePage() {
  const { data: user } = useCurrentUser()
  const logoutMutation = useLogout()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await logoutMutation.mutateAsync()
    navigate('/login')
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-lg rounded-xl border border-gray-200 bg-white px-8 py-8 shadow-sm space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Workspace</h1>
          <p className="mt-1 text-sm text-gray-500">Phase 2 placeholder — full dashboards arrive in Phase 3.</p>
        </div>

        {user && (
          <div className="rounded-md bg-gray-50 border border-gray-200 px-4 py-4 space-y-1 text-sm">
            <p><span className="font-medium text-gray-700">Name:</span> {user.name}</p>
            <p><span className="font-medium text-gray-700">Email:</span> {user.email}</p>
            <p>
              <span className="font-medium text-gray-700">Role:</span>{' '}
              <span className="inline-flex items-center rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700 capitalize">
                {user.role}
              </span>
            </p>
          </div>
        )}

        <button
          onClick={handleLogout}
          disabled={logoutMutation.isPending}
          className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
        >
          {logoutMutation.isPending ? 'Signing out…' : 'Sign out'}
        </button>
      </div>
    </div>
  )
}
