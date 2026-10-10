interface AuthLayoutProps {
  title: string
  subtitle?: string
  children: React.ReactNode
}

export function AuthLayout({ title, subtitle, children }: AuthLayoutProps) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12">
      <div className="w-full max-w-md">
        {/* Logo / brand */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-gray-900">DealRoom</h1>
          <h2 className="mt-2 text-xl font-semibold text-gray-800">{title}</h2>
          {subtitle && (
            <p className="mt-1 text-sm text-gray-500">{subtitle}</p>
          )}
        </div>

        <div className="rounded-xl border border-gray-200 bg-white px-8 py-8 shadow-sm">
          {children}
        </div>
      </div>
    </div>
  )
}
