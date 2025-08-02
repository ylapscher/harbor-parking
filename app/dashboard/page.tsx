import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { Navigation } from '@/components/layout/Navigation'
import { Dashboard } from '@/components/dashboard/Dashboard'

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <Navigation />
      <Dashboard />
    </ProtectedRoute>
  )
}