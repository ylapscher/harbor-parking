'use client'

import { useState } from 'react'

interface Activity {
  type: string
  id: string
  created_at: string
  user: string
  description: string
  status: string
}

interface ActivityMonitorProps {
  activities: Activity[]
  onRefresh: () => void
}

export function ActivityMonitor({ activities, onRefresh }: ActivityMonitorProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [typeFilter, setTypeFilter] = useState<'all' | 'claim' | 'availability'>('all')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'pending' | 'confirmed' | 'cancelled'>('all')
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 20

  const filteredActivities = activities.filter(activity => {
    const matchesSearch = activity.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         activity.user?.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesType = typeFilter === 'all' || activity.type === typeFilter

    const matchesStatus = statusFilter === 'all' || activity.status === statusFilter

    return matchesSearch && matchesType && matchesStatus
  })

  const totalPages = Math.ceil(filteredActivities.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const currentActivities = filteredActivities.slice(startIndex, startIndex + itemsPerPage)

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'claim':
        return '🚗'
      case 'availability':
        return '📅'
      default:
        return '📋'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
      case 'active':
        return 'bg-green-100 text-green-800'
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      case 'cancelled':
      case 'expired':
        return 'bg-red-100 text-red-800'
      case 'inactive':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-blue-100 text-blue-800'
    }
  }

  return (
    <div className="space-y-6">
      {/* Header and Controls */}
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-bold text-white">Activity Monitor</h2>
            <button
              onClick={onRefresh}
              className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm font-medium transition-colors"
            >
              Refresh
            </button>
          </div>
          
          <div className="text-sm text-gray-300">
            {filteredActivities.length} activities found
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search activities by description or user..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder-gray-400"
            />
          </div>
          
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as 'all' | 'claim' | 'availability')}
            className="px-4 py-2 bg-gray-700 border border-gray-600 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">All Types</option>
            <option value="claim">Claims</option>
            <option value="availability">Availabilities</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as 'all' | 'active' | 'pending' | 'confirmed' | 'cancelled')}
            className="px-4 py-2 bg-gray-700 border border-gray-600 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active</option>
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Activity Feed */}
      <div className="bg-gray-800 rounded-lg border border-gray-700">
        <div className="p-6">
          <div className="space-y-4">
            {currentActivities.map((activity, index) => (
              <div key={`${activity.type}-${activity.id}-${index}`} className="flex items-start gap-4 p-4 bg-gray-700 rounded-lg border border-gray-600">
                <div className="text-2xl">{getActivityIcon(activity.type)}</div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-white font-medium">{activity.description}</p>
                    <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${getStatusColor(activity.status)}`}>
                      {activity.status}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-4 text-sm text-gray-400">
                    <span>👤 {activity.user || 'Unknown User'}</span>
                    <span>📅 {new Date(activity.created_at).toLocaleString()}</span>
                    <span className="capitalize">🏷️ {activity.type}</span>
                  </div>
                </div>
              </div>
            ))}

            {currentActivities.length === 0 && (
              <div className="text-center py-12">
                <div className="text-gray-400 mb-4">
                  <svg className="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <p className="text-gray-400 text-lg mb-2">No activities found</p>
                <p className="text-gray-500 text-sm">
                  {searchTerm || typeFilter !== 'all' || statusFilter !== 'all'
                    ? 'Try adjusting your filters'
                    : 'Activity will appear here as users interact with the system'
                  }
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="bg-gray-700 px-6 py-3 flex items-center justify-between border-t border-gray-600">
            <div className="text-sm text-gray-300">
              Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, filteredActivities.length)} of {filteredActivities.length} activities
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 bg-gray-600 hover:bg-gray-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded text-sm transition-colors"
              >
                Previous
              </button>
              
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const page = currentPage <= 3 ? i + 1 : currentPage - 2 + i
                  if (page > totalPages) return null
                  
                  return (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`px-3 py-1 rounded text-sm transition-colors ${
                        currentPage === page
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-600 hover:bg-gray-500 text-gray-300'
                      }`}
                    >
                      {page}
                    </button>
                  )
                })}
              </div>
              
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="px-3 py-1 bg-gray-600 hover:bg-gray-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded text-sm transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}