'use client'

import { useState } from 'react'
import { getSupabaseClient } from '@/lib/supabase/singleton'
import { Profile } from '@/types'

interface ExtendedProfile extends Profile {
  parking_spots_count?: number
  claims_count?: number
  last_activity?: string
}

interface UserManagementTableProps {
  users: ExtendedProfile[]
  onRefresh: () => void
}

export function UserManagementTable({ users, onRefresh }: UserManagementTableProps) {
  const [loading, setLoading] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'admin'>('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedUsers, setSelectedUsers] = useState<string[]>([])
  const itemsPerPage = 10

  const supabase = getSupabaseClient()

  const handleUserAction = async (userId: string, action: 'approve' | 'reject' | 'make_admin' | 'remove_admin') => {
    setLoading(userId)
    try {
      let updateData: Partial<Profile> = {}
      
      switch (action) {
        case 'approve':
          updateData = { is_approved: true }
          break
        case 'reject':
          updateData = { is_approved: false }
          break
        case 'make_admin':
          updateData = { is_admin: true, is_approved: true }
          break
        case 'remove_admin':
          updateData = { is_admin: false }
          break
      }

      const { error } = await supabase
        .from('profiles')
        .update({
          ...updateData,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId)

      if (error) throw error

      onRefresh()
    } catch (error) {
      console.error(`Failed to ${action} user:`, error)
    } finally {
      setLoading(null)
    }
  }

  const handleBulkAction = async (action: 'approve' | 'reject') => {
    if (selectedUsers.length === 0) return

    setLoading('bulk')
    try {
      const updateData = action === 'approve' ? { is_approved: true } : { is_approved: false }

      const { error } = await supabase
        .from('profiles')
        .update({
          ...updateData,
          updated_at: new Date().toISOString(),
        })
        .in('id', selectedUsers)

      if (error) throw error

      setSelectedUsers([])
      onRefresh()
    } catch (error) {
      console.error(`Failed to ${action} users:`, error)
    } finally {
      setLoading(null)
    }
  }

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.apartment_number.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesStatus = statusFilter === 'all' ||
                         (statusFilter === 'pending' && !user.is_approved) ||
                         (statusFilter === 'approved' && user.is_approved && !user.is_admin) ||
                         (statusFilter === 'admin' && user.is_admin)

    return matchesSearch && matchesStatus
  })

  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const currentUsers = filteredUsers.slice(startIndex, startIndex + itemsPerPage)

  const toggleUserSelection = (userId: string) => {
    setSelectedUsers(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    )
  }

  const toggleAllUsers = () => {
    setSelectedUsers(
      selectedUsers.length === currentUsers.length 
        ? [] 
        : currentUsers.map(user => user.id)
    )
  }

  return (
    <div className="space-y-6">
      {/* Header and Controls */}
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
          <h2 className="text-xl font-bold text-white">User Management</h2>
          
          {selectedUsers.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-300">
                {selectedUsers.length} selected
              </span>
              <button
                onClick={() => handleBulkAction('approve')}
                disabled={loading === 'bulk'}
                className="bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white px-3 py-1 rounded text-sm font-medium transition-colors"
              >
                Bulk Approve
              </button>
              <button
                onClick={() => handleBulkAction('reject')}
                disabled={loading === 'bulk'}
                className="bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white px-3 py-1 rounded text-sm font-medium transition-colors"
              >
                Bulk Reject
              </button>
            </div>
          )}
        </div>

        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search users by name, email, or apartment..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder-gray-400"
            />
          </div>
          
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as 'all' | 'pending' | 'approved' | 'admin')}
            className="px-4 py-2 bg-gray-700 border border-gray-600 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">All Users</option>
            <option value="pending">Pending Approval</option>
            <option value="approved">Approved Users</option>
            <option value="admin">Administrators</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={selectedUsers.length === currentUsers.length && currentUsers.length > 0}
                    onChange={toggleAllUsers}
                    className="rounded border-gray-600 bg-gray-700 text-blue-600 focus:ring-blue-500"
                  />
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Apartment
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Spots
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Claims
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Joined
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {currentUsers.map((user) => (
                <tr key={user.id} className="hover:bg-gray-700">
                  <td className="px-6 py-4">
                    <input
                      type="checkbox"
                      checked={selectedUsers.includes(user.id)}
                      onChange={() => toggleUserSelection(user.id)}
                      className="rounded border-gray-600 bg-gray-700 text-blue-600 focus:ring-blue-500"
                    />
                  </td>
                  <td className="px-6 py-4">
                    <div>
                      <div className="text-sm font-medium text-white">
                        {user.full_name || 'No name provided'}
                      </div>
                      <div className="text-sm text-gray-400">{user.email}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-white">
                    {user.apartment_number}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-1">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        user.is_approved
                          ? 'bg-green-100 text-green-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {user.is_approved ? 'Approved' : 'Pending'}
                      </span>
                      {user.is_admin && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          Admin
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-white">
                    {user.parking_spots_count || 0}
                  </td>
                  <td className="px-6 py-4 text-sm text-white">
                    {user.claims_count || 0}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-400">
                    {new Date(user.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      {!user.is_approved && (
                        <>
                          <button
                            onClick={() => handleUserAction(user.id, 'approve')}
                            disabled={loading === user.id}
                            className="bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white px-2 py-1 rounded text-xs font-medium transition-colors"
                          >
                            {loading === user.id ? '...' : 'Approve'}
                          </button>
                          <button
                            onClick={() => handleUserAction(user.id, 'reject')}
                            disabled={loading === user.id}
                            className="bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white px-2 py-1 rounded text-xs font-medium transition-colors"
                          >
                            Reject
                          </button>
                        </>
                      )}
                      
                      {user.is_approved && !user.is_admin && (
                        <button
                          onClick={() => handleUserAction(user.id, 'make_admin')}
                          disabled={loading === user.id}
                          className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-2 py-1 rounded text-xs font-medium transition-colors"
                        >
                          Make Admin
                        </button>
                      )}
                      
                      {user.is_admin && (
                        <button
                          onClick={() => handleUserAction(user.id, 'remove_admin')}
                          disabled={loading === user.id}
                          className="bg-gray-600 hover:bg-gray-700 disabled:opacity-50 text-white px-2 py-1 rounded text-xs font-medium transition-colors"
                        >
                          Remove Admin
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="bg-gray-700 px-6 py-3 flex items-center justify-between border-t border-gray-600">
            <div className="text-sm text-gray-300">
              Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, filteredUsers.length)} of {filteredUsers.length} users
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