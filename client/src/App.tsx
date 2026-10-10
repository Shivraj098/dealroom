import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useCurrentUser } from '@/features/auth/api'
import { ProtectedRoute } from '@/components/layouts/ProtectedRoute'
import { HomePage } from '@/pages/HomePage'
import { LoginPage } from '@/features/auth/pages/LoginPage'
import { RegisterPage } from '@/features/auth/pages/RegisterPage'
import { WorkspacePage } from '@/pages/WorkspacePage'
import { NotFoundPage } from '@/pages/NotFoundPage'

/**
 * Redirect an already-authenticated user away from auth pages.
 * Prevents logged-in users landing on /login again.
 */
function AuthGuard({ children }: { children: React.ReactNode }) {
  const { data: user, isLoading } = useCurrentUser()
  if (isLoading) return null
  if (user) return <Navigate to="/workspace" replace />
  return <>{children}</>
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public */}
        <Route path="/" element={<HomePage />} />
        <Route
          path="/login"
          element={
            <AuthGuard>
              <LoginPage />
            </AuthGuard>
          }
        />
        <Route
          path="/register"
          element={
            <AuthGuard>
              <RegisterPage />
            </AuthGuard>
          }
        />

        {/* Protected — any authenticated role */}
        <Route
          path="/workspace"
          element={
            <ProtectedRoute>
              <WorkspacePage />
            </ProtectedRoute>
          }
        />

        {/* 404 */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
