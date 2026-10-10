import { Link } from 'react-router-dom'

export function HomePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-linear-to-b from-gray-50 to-gray-100">
      <div className="text-center space-y-6 px-4">
        <h1 className="text-6xl font-bold text-gray-900">DealRoom</h1>
        <p className="text-xl text-gray-600 max-w-2xl">
          Startup due-diligence and investor collaboration platform
        </p>
        <div className="flex gap-4 justify-center mt-8">
          <Link
            to="/login"
            className="rounded-lg bg-blue-600 px-6 py-3 text-white font-medium hover:bg-blue-700 transition-colors"
          >
            Sign In
          </Link>
          <Link
            to="/register"
            className="rounded-lg border border-gray-300 bg-white px-6 py-3 font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Create Account
          </Link>
        </div>
        <p className="text-sm text-gray-500 mt-8">
          Phase 2: Authentication complete
        </p>
      </div>
    </div>
  )
}
