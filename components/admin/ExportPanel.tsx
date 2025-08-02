'use client'

import { useState } from 'react'
import { Profile, ParkingSpot } from '@/types'

interface ExtendedProfile extends Profile {
  parking_spots_count?: number
  claims_count?: number
  last_activity?: string
}

interface SpotWithOwner extends ParkingSpot {
  profiles: {
    full_name: string
    apartment_number: string
  }
}

interface Activity {
  type: string
  id: string
  created_at: string
  user: string
  description: string
  status: string
}

interface ExportPanelProps {
  users: ExtendedProfile[]
  spots: SpotWithOwner[]
  activities: Activity[]
}

export function ExportPanel({ users, spots, activities }: ExportPanelProps) {
  const [loading, setLoading] = useState<string | null>(null)
  const [exportFormat, setExportFormat] = useState<'csv' | 'json'>('csv')

  const downloadCSV = (data: any[], filename: string, headers: string[]) => {
    const csvContent = [
      headers.join(','),
      ...data.map(row => headers.map(header => {
        const value = row[header.toLowerCase().replace(/\s+/g, '_')] || ''
        return `"${String(value).replace(/"/g, '""')}"`
      }).join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `${filename}.csv`
    link.click()
    URL.revokeObjectURL(link.href)
  }

  const downloadJSON = (data: any[], filename: string) => {
    const jsonContent = JSON.stringify(data, null, 2)
    const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `${filename}.json`
    link.click()
    URL.revokeObjectURL(link.href)
  }

  const handleExport = (type: 'users' | 'spots' | 'activities' | 'full') => {
    setLoading(type)
    
    try {
      const timestamp = new Date().toISOString().split('T')[0]
      
      if (type === 'users') {
        const userData = users.map(user => ({
          id: user.id,
          full_name: user.full_name,
          email: user.email,
          apartment_number: user.apartment_number,
          phone_number: user.phone_number,
          is_approved: user.is_approved,
          is_admin: user.is_admin,
          parking_spots_count: user.parking_spots_count || 0,
          claims_count: user.claims_count || 0,
          created_at: user.created_at,
          updated_at: user.updated_at,
        }))

        if (exportFormat === 'csv') {
          downloadCSV(userData, `users-${timestamp}`, [
            'ID', 'Full Name', 'Email', 'Apartment Number', 'Phone Number',
            'Is Approved', 'Is Admin', 'Parking Spots Count', 'Claims Count',
            'Created At', 'Updated At'
          ])
        } else {
          downloadJSON(userData, `users-${timestamp}`)
        }
      } else if (type === 'spots') {
        const spotData = spots.map(spot => ({
          id: spot.id,
          spot_number: spot.spot_number,
          owner_id: spot.owner_id,
          owner_name: spot.profiles?.full_name,
          owner_apartment: spot.profiles?.apartment_number,
          building_section: spot.building_section,
          is_verified: spot.is_verified,
          created_at: spot.created_at,
          updated_at: spot.updated_at,
        }))

        if (exportFormat === 'csv') {
          downloadCSV(spotData, `parking-spots-${timestamp}`, [
            'ID', 'Spot Number', 'Owner ID', 'Owner Name', 'Owner Apartment',
            'Building Section', 'Is Verified', 'Created At', 'Updated At'
          ])
        } else {
          downloadJSON(spotData, `parking-spots-${timestamp}`)
        }
      } else if (type === 'activities') {
        const activityData = activities.map(activity => ({
          type: activity.type,
          id: activity.id,
          user: activity.user,
          description: activity.description,
          status: activity.status,
          created_at: activity.created_at,
        }))

        if (exportFormat === 'csv') {
          downloadCSV(activityData, `activities-${timestamp}`, [
            'Type', 'ID', 'User', 'Description', 'Status', 'Created At'
          ])
        } else {
          downloadJSON(activityData, `activities-${timestamp}`)
        }
      } else if (type === 'full') {
        const fullReport = {
          generated_at: new Date().toISOString(),
          summary: {
            total_users: users.length,
            pending_approvals: users.filter(u => !u.is_approved).length,
            total_spots: spots.length,
            unverified_spots: spots.filter(s => !s.is_verified).length,
            total_activities: activities.length,
          },
          users: users.map(user => ({
            id: user.id,
            full_name: user.full_name,
            email: user.email,
            apartment_number: user.apartment_number,
            phone_number: user.phone_number,
            is_approved: user.is_approved,
            is_admin: user.is_admin,
            parking_spots_count: user.parking_spots_count || 0,
            claims_count: user.claims_count || 0,
            created_at: user.created_at,
            updated_at: user.updated_at,
          })),
          parking_spots: spots.map(spot => ({
            id: spot.id,
            spot_number: spot.spot_number,
            owner_id: spot.owner_id,
            owner_name: spot.profiles?.full_name,
            owner_apartment: spot.profiles?.apartment_number,
            building_section: spot.building_section,
            is_verified: spot.is_verified,
            created_at: spot.created_at,
            updated_at: spot.updated_at,
          })),
          recent_activities: activities.map(activity => ({
            type: activity.type,
            id: activity.id,
            user: activity.user,
            description: activity.description,
            status: activity.status,
            created_at: activity.created_at,
          })),
        }

        downloadJSON(fullReport, `harbor-parking-full-report-${timestamp}`)
      }
    } catch (error) {
      console.error('Export failed:', error)
    } finally {
      setLoading(null)
    }
  }

  const generateSystemReport = () => {
    const approvedUsers = users.filter(u => u.is_approved)
    const pendingUsers = users.filter(u => !u.is_approved)
    const verifiedSpots = spots.filter(s => s.is_verified)
    const unverifiedSpots = spots.filter(s => !s.is_verified)
    const recentActivities = activities.slice(0, 10)

    return {
      summary: {
        totalUsers: users.length,
        approvedUsers: approvedUsers.length,
        pendingUsers: pendingUsers.length,
        totalSpots: spots.length,
        verifiedSpots: verifiedSpots.length,
        unverifiedSpots: unverifiedSpots.length,
        totalActivities: activities.length,
      },
      topActiveUsers: approvedUsers
        .sort((a, b) => (b.claims_count || 0) - (a.claims_count || 0))
        .slice(0, 5),
      recentActivities,
    }
  }

  const report = generateSystemReport()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <h2 className="text-xl font-bold text-white mb-4">Export & Reports</h2>
        
        <div className="flex items-center gap-4 mb-4">
          <label className="text-white font-medium">Export Format:</label>
          <select
            value={exportFormat}
            onChange={(e) => setExportFormat(e.target.value as 'csv' | 'json')}
            className="px-4 py-2 bg-gray-700 border border-gray-600 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="csv">CSV</option>
            <option value="json">JSON</option>
          </select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <button
            onClick={() => handleExport('users')}
            disabled={loading === 'users'}
            className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white p-4 rounded-lg text-left transition-colors"
          >
            <h4 className="font-medium mb-1">Export Users</h4>
            <p className="text-sm text-blue-200">{users.length} users</p>
            {loading === 'users' && <p className="text-xs text-blue-300 mt-1">Exporting...</p>}
          </button>

          <button
            onClick={() => handleExport('spots')}
            disabled={loading === 'spots'}
            className="bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white p-4 rounded-lg text-left transition-colors"
          >
            <h4 className="font-medium mb-1">Export Spots</h4>
            <p className="text-sm text-green-200">{spots.length} spots</p>
            {loading === 'spots' && <p className="text-xs text-green-300 mt-1">Exporting...</p>}
          </button>

          <button
            onClick={() => handleExport('activities')}
            disabled={loading === 'activities'}
            className="bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white p-4 rounded-lg text-left transition-colors"
          >
            <h4 className="font-medium mb-1">Export Activities</h4>
            <p className="text-sm text-purple-200">{activities.length} activities</p>
            {loading === 'activities' && <p className="text-xs text-purple-300 mt-1">Exporting...</p>}
          </button>

          <button
            onClick={() => handleExport('full')}
            disabled={loading === 'full'}
            className="bg-yellow-600 hover:bg-yellow-700 disabled:opacity-50 text-white p-4 rounded-lg text-left transition-colors"
          >
            <h4 className="font-medium mb-1">Full Report</h4>
            <p className="text-sm text-yellow-200">Complete system data</p>
            {loading === 'full' && <p className="text-xs text-yellow-300 mt-1">Generating...</p>}
          </button>
        </div>
      </div>

      {/* System Report Preview */}
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <h3 className="text-lg font-semibold text-white mb-4">System Overview</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-gray-700 rounded-lg p-4">
            <h4 className="text-sm font-medium text-gray-300">Users</h4>
            <p className="text-2xl font-bold text-white">{report.summary.totalUsers}</p>
            <p className="text-xs text-gray-400">
              {report.summary.approvedUsers} approved, {report.summary.pendingUsers} pending
            </p>
          </div>

          <div className="bg-gray-700 rounded-lg p-4">
            <h4 className="text-sm font-medium text-gray-300">Parking Spots</h4>
            <p className="text-2xl font-bold text-white">{report.summary.totalSpots}</p>
            <p className="text-xs text-gray-400">
              {report.summary.verifiedSpots} verified, {report.summary.unverifiedSpots} unverified
            </p>
          </div>

          <div className="bg-gray-700 rounded-lg p-4">
            <h4 className="text-sm font-medium text-gray-300">Activities</h4>
            <p className="text-2xl font-bold text-white">{report.summary.totalActivities}</p>
            <p className="text-xs text-gray-400">Total system activities</p>
          </div>

          <div className="bg-gray-700 rounded-lg p-4">
            <h4 className="text-sm font-medium text-gray-300">Utilization</h4>
            <p className="text-2xl font-bold text-white">
              {report.summary.totalSpots > 0 
                ? Math.round((report.summary.verifiedSpots / report.summary.totalSpots) * 100)
                : 0}%
            </p>
            <p className="text-xs text-gray-400">Spots verified</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Active Users */}
          <div>
            <h4 className="text-lg font-medium text-white mb-3">Most Active Users</h4>
            <div className="space-y-2">
              {report.topActiveUsers.map((user, index) => (
                <div key={user.id} className="flex items-center justify-between py-2 px-3 bg-gray-700 rounded">
                  <div>
                    <span className="text-white font-medium">{user.full_name}</span>
                    <span className="text-gray-400 text-sm ml-2">({user.apartment_number})</span>
                  </div>
                  <span className="text-blue-400 font-medium">{user.claims_count || 0} claims</span>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Activities */}
          <div>
            <h4 className="text-lg font-medium text-white mb-3">Recent Activity</h4>
            <div className="space-y-2">
              {report.recentActivities.map((activity, index) => (
                <div key={`${activity.type}-${activity.id}-${index}`} className="py-2 px-3 bg-gray-700 rounded">
                  <p className="text-white text-sm">{activity.description}</p>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-gray-400 text-xs">{activity.user}</span>
                    <span className="text-gray-400 text-xs">
                      {new Date(activity.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Export Instructions */}
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <h3 className="text-lg font-semibold text-white mb-4">Export Information</h3>
        <div className="prose prose-sm prose-invert">
          <ul className="text-gray-300 space-y-2">
            <li><strong>CSV Format:</strong> Compatible with Excel, Google Sheets, and most data analysis tools</li>
            <li><strong>JSON Format:</strong> Machine-readable format for technical integrations and backup</li>
            <li><strong>Full Report:</strong> Comprehensive JSON export including summary statistics</li>
            <li><strong>Data Privacy:</strong> Exports include only essential data for administrative purposes</li>
          </ul>
        </div>
      </div>
    </div>
  )
}