import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { Navigation } from '@/components/layout/Navigation'
import { AdminDashboard } from '@/components/admin/AdminDashboard'

export default function AdminPage() {
  return (
    <ProtectedRoute adminOnly>
      <Navigation />
      <div className="min-h-screen bg-gray-900">
        <div className="max-w-7xl mx-auto p-4">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-white mb-2">Admin Dashboard</h1>
            <p className="text-gray-400">Manage users, parking spots, and system settings</p>
          </div>
          <AdminDashboard />
        </div>
      </div>
    </ProtectedRoute>
  )
}