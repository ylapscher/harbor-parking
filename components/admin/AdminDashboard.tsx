'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../providers/AuthProvider'
import { createSupabaseBrowserClient } from '@/lib/supabase/client'
import { Profile, ParkingSpotWithOwner } from '@/types'
import { UserManagementTable } from './UserManagementTable'
import { SpotVerificationTable } from './SpotVerificationTable'
import { ActivityMonitor } from './ActivityMonitor'
import { SystemSettings } from './SystemSettings'
import { ExportPanel } from './ExportPanel'

interface AdminStats {
  totalUsers: number
  pendingApprovals: number
  totalSpots: number
  unverifiedSpots: number
  activeClaims: number
  totalClaims: number
}

interface ExtendedProfile extends Profile {
  parking_spots_count?: number
  claims_count?: number
  last_activity?: string
}


interface Activity {
  type: string
  id: string
  created_at: string
  user: string
  description: string
  status: string
}

export function AdminDashboard() {
  const { user } = useAuth()!
  const [activeTab, setActiveTab] = useState('overview')
  const [stats, setStats] = useState<AdminStats>({
    totalUsers: 0,
    pendingApprovals: 0,
    totalSpots: 0,
    unverifiedSpots: 0,
    activeClaims: 0,
    totalClaims: 0,
  })
  const [users, setUsers] = useState<ExtendedProfile[]>([])
  const [spots, setSpots] = useState<ParkingSpotWithOwner[]>([])
  const [recentActivity, setRecentActivity] = useState<Activity[]>([])
  const [loading, setLoading] = useState(true)

  const supabase = createSupabaseBrowserClient()

  const fetchAdminData = useCallback(async () => {
    if (!user) return

    try {
      setLoading(true)

      // Fetch users with additional stats
      const { data: usersData } = await supabase
        .from('profiles')
        .select(`
          *,
          parking_spots!parking_spots_owner_id_fkey(count),
          claims!claims_claimer_id_fkey(count)
        `)
        .order('created_at', { ascending: false })

      // Fetch all parking spots with owner details
      const { data: spotsData } = await supabase
        .from('parking_spots')
        .select(`
          *,
          profiles!parking_spots_owner_id_fkey(
            full_name,
            apartment_number,
            email
          )
        `)
        .order('created_at', { ascending: false })

      // Fetch recent activity (claims and availabilities)
      const { data: recentClaims } = await supabase
        .from('claims')
        .select(`
          *,
          profiles!claims_claimer_id_fkey(full_name, apartment_number),
          availabilities(
            *,
            parking_spots(
              spot_number,
              profiles!parking_spots_owner_id_fkey(full_name, apartment_number)
            )
          )
        `)
        .order('created_at', { ascending: false })
        .limit(20)

      const { data: recentAvailabilities } = await supabase
        .from('availabilities')
        .select(`
          *,
          parking_spots(
            spot_number,
            profiles!parking_spots_owner_id_fkey(full_name, apartment_number)
          )
        `)
        .order('created_at', { ascending: false })
        .limit(20)

      // Calculate stats
      const totalUsers = usersData?.length || 0
      const pendingApprovals = usersData?.filter(u => !u.is_approved).length || 0
      const totalSpots = spotsData?.length || 0
      const unverifiedSpots = spotsData?.filter(s => !s.is_active).length || 0
      const activeClaims = recentClaims?.filter(c => c.status === 'pending' || c.status === 'confirmed').length || 0
      const totalClaims = recentClaims?.length || 0

      setStats({
        totalUsers,
        pendingApprovals,
        totalSpots,
        unverifiedSpots,
        activeClaims,
        totalClaims,
      })

      setUsers(usersData || [])
      setSpots(spotsData || [])

      // Combine and sort recent activity
      const combinedActivity: Activity[] = [
        ...(recentClaims || []).map(claim => ({
          type: 'claim',
          id: claim.id,
          created_at: claim.created_at ?? new Date(0).toISOString(),
          user: claim.profiles?.full_name ?? 'Unknown',
          description: `Claimed spot ${claim.availabilities?.parking_spots?.spot_number}`,
          status: claim.status ?? 'unknown',
        })),
        ...(recentAvailabilities || []).map(availability => ({
          type: 'availability',
          id: availability.id,
          created_at: availability.created_at ?? new Date(0).toISOString(),
          user: availability.parking_spots?.profiles?.full_name ?? 'Unknown',
          description: `Made spot ${availability.parking_spots?.spot_number} available`,
          status: availability.is_active ? 'active' : 'inactive',
        })),
      ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

      setRecentActivity(combinedActivity.slice(0, 20))
    } catch (error) {
      console.error('Failed to fetch admin data:', error)
    } finally {
      setLoading(false)
    }
  }, [user, supabase])

  useEffect(() => {
    fetchAdminData()
  }, [fetchAdminData])

  const refreshData = () => {
    fetchAdminData()
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 p-4">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700 animate-pulse">
            <div className="h-8 bg-gray-700 rounded w-1/4 mb-2"></div>
            <div className="h-4 bg-gray-700 rounded w-1/2"></div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-gray-800 rounded-lg p-6 border border-gray-700 animate-pulse">
                <div className="h-6 bg-gray-700 rounded w-3/4 mb-4"></div>
                <div className="h-4 bg-gray-700 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  const tabs = [
    { id: 'overview', name: 'Overview', icon: '📊' },
    { id: 'users', name: 'User Management', icon: '👥' },
    { id: 'spots', name: 'Spot Verification', icon: '🅿️' },
    { id: 'activity', name: 'Activity Monitor', icon: '📈' },
    { id: 'settings', name: 'System Settings', icon: '⚙️' },
    { id: 'export', name: 'Export & Reports', icon: '📋' },
  ]

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="bg-gray-800 rounded-lg border border-gray-700">
        <div className="flex overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center space-x-2 px-6 py-4 text-sm font-medium whitespace-nowrap transition-colors ${
                activeTab === tab.id
                  ? 'text-blue-400 border-b-2 border-blue-400'
                  : 'text-gray-300 hover:text-white'
              }`}
            >
              <span>{tab.icon}</span>
              <span>{tab.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <h3 className="text-lg font-semibold text-white mb-2">Total Users</h3>
              <p className="text-3xl font-bold text-blue-400">{stats.totalUsers}</p>
              <p className="text-sm text-gray-400">Registered residents</p>
            </div>

            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <h3 className="text-lg font-semibold text-white mb-2">Pending Approvals</h3>
              <p className="text-3xl font-bold text-yellow-400">{stats.pendingApprovals}</p>
              <p className="text-sm text-gray-400">Awaiting admin review</p>
            </div>

            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <h3 className="text-lg font-semibold text-white mb-2">Parking Spots</h3>
              <p className="text-3xl font-bold text-green-400">{stats.totalSpots}</p>
              <p className="text-sm text-gray-400">
                {stats.unverifiedSpots} unverified
              </p>
            </div>

            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <h3 className="text-lg font-semibold text-white mb-2">Active Claims</h3>
              <p className="text-3xl font-bold text-purple-400">{stats.activeClaims}</p>
              <p className="text-sm text-gray-400">
                {stats.totalClaims} total claims
              </p>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <h3 className="text-xl font-bold text-white mb-4">Quick Actions</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <button
                onClick={() => setActiveTab('users')}
                className="bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-lg text-left transition-colors"
              >
                <h4 className="font-medium">Review Pending Users</h4>
                <p className="text-sm text-blue-200">{stats.pendingApprovals} users waiting</p>
              </button>

              <button
                onClick={() => setActiveTab('spots')}
                className="bg-green-600 hover:bg-green-700 text-white p-4 rounded-lg text-left transition-colors"
              >
                <h4 className="font-medium">Verify Parking Spots</h4>
                <p className="text-sm text-green-200">{stats.unverifiedSpots} spots to verify</p>
              </button>

              <button
                onClick={() => setActiveTab('export')}
                className="bg-purple-600 hover:bg-purple-700 text-white p-4 rounded-lg text-left transition-colors"
              >
                <h4 className="font-medium">Generate Reports</h4>
                <p className="text-sm text-purple-200">Export system data</p>
              </button>
            </div>
          </div>

          {/* Recent Activity Preview */}
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-white">Recent Activity</h3>
              <button
                onClick={() => setActiveTab('activity')}
                className="text-blue-400 hover:text-blue-300 text-sm font-medium"
              >
                View All →
              </button>
            </div>
            <div className="space-y-3">
              {recentActivity.slice(0, 5).map((activity) => (
                <div key={`${activity.type}-${activity.id}`} className="flex items-center justify-between py-2 border-b border-gray-700 last:border-b-0">
                  <div>
                    <p className="text-white text-sm">{String(activity.description)}</p>
                    <p className="text-gray-400 text-xs">
                      by {String(activity.user)} • {new Date(String(activity.created_at)).toLocaleDateString()}
                    </p>
                  </div>
                  <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${
                    activity.status === 'confirmed' || activity.status === 'active'
                      ? 'bg-green-100 text-green-800'
                      : activity.status === 'pending'
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {String(activity.status)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* User Management Tab */}
      {activeTab === 'users' && (
        <UserManagementTable
          users={users}
          onRefresh={refreshData}
        />
      )}

      {/* Spot Verification Tab */}
      {activeTab === 'spots' && (
        <SpotVerificationTable
          spots={spots}
          onRefresh={refreshData}
        />
      )}

      {/* Activity Monitor Tab */}
      {activeTab === 'activity' && (
        <ActivityMonitor
          activities={recentActivity}
          onRefresh={refreshData}
        />
      )}

      {/* System Settings Tab */}
      {activeTab === 'settings' && (
        <SystemSettings onRefresh={refreshData} />
      )}

      {/* Export & Reports Tab */}
      {activeTab === 'export' && (
        <ExportPanel
          users={users}
          spots={spots}
          activities={recentActivity}
        />
      )}
    </div>
  )
}