import { Link } from 'react-router-dom'

export function NotFoundPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50">
      <div className="text-center space-y-6 px-4">
        <h1 className="text-9xl font-bold text-gray-900">404</h1>
        <p className="text-2xl text-gray-600">Page not found</p>
        <p className="text-gray-500">
          The page you're looking for doesn't exist.
        </p>
        <Link
          to="/"
          className="inline-block rounded-lg bg-blue-600 px-6 py-3 text-white font-medium hover:bg-blue-700 transition-colors mt-4"
        >
          Go Home
        </Link>
      </div>
    </div>
  )
}
