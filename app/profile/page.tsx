import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { Navigation } from '@/components/layout/Navigation'
import { UserProfile } from '@/components/profile/UserProfile'

export default function ProfilePage() {
  return (
    <ProtectedRoute>
      <Navigation />
      <div className="min-h-screen bg-gray-900">
        <div className="max-w-4xl mx-auto p-4">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-white mb-2">Profile Settings</h1>
            <p className="text-gray-400">Manage your account information and preferences</p>
          </div>
          <UserProfile />
        </div>
      </div>
    </ProtectedRoute>
  )
}