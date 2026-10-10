import { AuthLayout } from '@/components/layouts/AuthLayout'
import { RegisterForm } from '../components/RegisterForm'

export function RegisterPage() {
  return (
    <AuthLayout title="Create an account" subtitle="Join DealRoom as a founder or investor">
      <RegisterForm />
    </AuthLayout>
  )
}
