'use client'

import { useState } from 'react'
import { createSupabaseBrowserClient } from '@/lib/supabase/client'
import { ParkingSpotWithOwner } from '@/types'

interface SpotVerificationTableProps {
  spots: ParkingSpotWithOwner[]
  onRefresh: () => void
}

export function SpotVerificationTable({ spots, onRefresh }: SpotVerificationTableProps) {
  const [loading, setLoading] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'verified' | 'pending'>('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedSpots, setSelectedSpots] = useState<string[]>([])
  const itemsPerPage = 10

  const supabase = createSupabaseBrowserClient()

  const handleSpotAction = async (spotId: string, action: 'verify' | 'unverify' | 'delete') => {
    setLoading(spotId)
    try {
      if (action === 'delete') {
        // Delete associated availabilities first
        await supabase
          .from('availabilities')
          .delete()
          .eq('spot_id', spotId)

        // Delete the spot
        const { error } = await supabase
          .from('parking_spots')
          .delete()
          .eq('id', spotId)

        if (error) throw error
      } else {
        const { error } = await supabase
          .from('parking_spots')
          .update({
            is_verified: action === 'verify',
            is_active: action === 'verify', // Only active if verified
            updated_at: new Date().toISOString(),
          })
          .eq('id', spotId)

        if (error) throw error
      }

      onRefresh()
    } catch (error) {
      console.error(`Failed to ${action} spot:`, error)
    } finally {
      setLoading(null)
    }
  }

  const handleBulkAction = async (action: 'verify' | 'unverify' | 'delete') => {
    if (selectedSpots.length === 0) return

    setLoading('bulk')
    try {
      if (action === 'delete') {
        // Delete associated availabilities first
        await supabase
          .from('availabilities')
          .delete()
          .in('spot_id', selectedSpots)

        // Delete the spots
        const { error } = await supabase
          .from('parking_spots')
          .delete()
          .in('id', selectedSpots)

        if (error) throw error
      } else {
        const { error } = await supabase
          .from('parking_spots')
          .update({
            is_verified: action === 'verify',
            is_active: action === 'verify', // Only active if verified
            updated_at: new Date().toISOString(),
          })
          .in('id', selectedSpots)

        if (error) throw error
      }

      setSelectedSpots([])
      onRefresh()
    } catch (error) {
      console.error(`Failed to ${action} spots:`, error)
    } finally {
      setLoading(null)
    }
  }

  const filteredSpots = spots.filter(spot => {
    const matchesSearch = spot.spot_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         spot.location?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         spot.profiles?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         spot.profiles?.apartment_number?.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesStatus = statusFilter === 'all' ||
                         (statusFilter === 'verified' && spot.is_verified) ||
                         (statusFilter === 'pending' && !spot.is_verified)

    return matchesSearch && matchesStatus
  })

  const totalPages = Math.ceil(filteredSpots.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const currentSpots = filteredSpots.slice(startIndex, startIndex + itemsPerPage)

  const toggleSpotSelection = (spotId: string) => {
    setSelectedSpots(prev => 
      prev.includes(spotId) 
        ? prev.filter(id => id !== spotId)
        : [...prev, spotId]
    )
  }

  const toggleAllSpots = () => {
    setSelectedSpots(
      selectedSpots.length === currentSpots.length 
        ? [] 
        : currentSpots.map(spot => spot.id)
    )
  }

  return (
    <div className="space-y-6">
      {/* Header and Controls */}
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
          <h2 className="text-xl font-bold text-white">Spot Verification</h2>
          
          {selectedSpots.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-300">
                {selectedSpots.length} selected
              </span>
              <button
                onClick={() => handleBulkAction('verify')}
                disabled={loading === 'bulk'}
                className="bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white px-3 py-1 rounded text-sm font-medium transition-colors"
              >
                Bulk Verify
              </button>
              <button
                onClick={() => handleBulkAction('unverify')}
                disabled={loading === 'bulk'}
                className="bg-yellow-600 hover:bg-yellow-700 disabled:opacity-50 text-white px-3 py-1 rounded text-sm font-medium transition-colors"
              >
                Bulk Reject
              </button>
              <button
                onClick={() => handleBulkAction('delete')}
                disabled={loading === 'bulk'}
                className="bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white px-3 py-1 rounded text-sm font-medium transition-colors"
              >
                Bulk Delete
              </button>
            </div>
          )}
        </div>

        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search spots by number, owner, apartment, or elevator..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder-gray-400"
            />
          </div>
          
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as 'all' | 'verified' | 'pending')}
            className="px-4 py-2 bg-gray-700 border border-gray-600 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">All Spots</option>
            <option value="verified">Verified</option>
            <option value="pending">Pending Approval</option>
          </select>
        </div>
      </div>

      {/* Spots Table */}
      <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={selectedSpots.length === currentSpots.length && currentSpots.length > 0}
                    onChange={toggleAllSpots}
                    className="rounded border-gray-600 bg-gray-700 text-blue-600 focus:ring-blue-500"
                  />
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Spot #
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Owner
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Apartment
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Elevator
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Registered
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {currentSpots.map((spot) => (
                <tr key={spot.id} className="hover:bg-gray-700">
                  <td className="px-6 py-4">
                    <input
                      type="checkbox"
                      checked={selectedSpots.includes(spot.id)}
                      onChange={() => toggleSpotSelection(spot.id)}
                      className="rounded border-gray-600 bg-gray-700 text-blue-600 focus:ring-blue-500"
                    />
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-white">
                      {spot.spot_number}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-white">
                      {spot.profiles?.full_name || 'Unknown'}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-white">
                    {spot.profiles?.apartment_number || 'Unknown'}
                  </td>
                  <td className="px-6 py-4 text-sm text-white">
                    {spot.location || 'Not specified'}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      spot.is_verified
                        ? 'bg-green-100 text-green-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {spot.is_verified ? 'Verified' : 'Pending Approval'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-400">
                    {new Date(spot.created_at ?? 0).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      {!spot.is_verified ? (
                        <button
                          onClick={() => handleSpotAction(spot.id, 'verify')}
                          disabled={loading === spot.id}
                          className="bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white px-2 py-1 rounded text-xs font-medium transition-colors"
                        >
                          {loading === spot.id ? '...' : 'Approve'}
                        </button>
                      ) : (
                        <button
                          onClick={() => handleSpotAction(spot.id, 'unverify')}
                          disabled={loading === spot.id}
                          className="bg-yellow-600 hover:bg-yellow-700 disabled:opacity-50 text-white px-2 py-1 rounded text-xs font-medium transition-colors"
                        >
                          {loading === spot.id ? '...' : 'Reject'}
                        </button>
                      )}
                      
                      <button
                        onClick={() => handleSpotAction(spot.id, 'delete')}
                        disabled={loading === spot.id}
                        className="bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white px-2 py-1 rounded text-xs font-medium transition-colors"
                        title="Delete spot and all associated availabilities"
                      >
                        Delete
                      </button>
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
              Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, filteredSpots.length)} of {filteredSpots.length} spots
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