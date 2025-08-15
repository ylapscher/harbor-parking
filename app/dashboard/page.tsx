import { Navigation } from '@/components/layout/Navigation'
import { Dashboard } from '@/components/dashboard/Dashboard'
import RequireAuth from '@/components/auth/RequireAuth'

export default function DashboardPage() {

  return (
    <RequireAuth>
      <Navigation />
      <Dashboard />
    </RequireAuth>
  )
}