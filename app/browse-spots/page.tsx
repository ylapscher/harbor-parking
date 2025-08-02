'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { getSupabaseClient } from '@/lib/supabase/singleton'
import { ParkingSpotCard } from '@/components/parking/ParkingSpotCard'
import { SpotClaimModal } from '@/components/parking/SpotClaimModal'
import { AvailabilityWithSpot } from '@/types'

export default function BrowseSpots() {
  const { user, loading: authLoading } = useAuth()
  const [availableSpots, setAvailableSpots] = useState<AvailabilityWithSpot[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedAvailability, setSelectedAvailability] = useState<AvailabilityWithSpot | null>(null)
  const [showClaimModal, setShowClaimModal] = useState(false)

  const supabase = getSupabaseClient()

  const fetchAvailableSpots = async () => {
    if (!user) return

    try {
      const { data: available } = await supabase
        .from('availabilities')
        .select('*')
        .eq('is_active', true)
        .gt('end_time', new Date().toISOString())
        .order('start_time', { ascending: true })

      setAvailableSpots(available || [])
    } catch {
      // Handle errors silently
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (user) {
      fetchAvailableSpots()
    }
  }, [user])

  const handleClaimSpot = (availability: AvailabilityWithSpot) => {
    setSelectedAvailability(availability)
    setShowClaimModal(true)
  }

  const filteredSpots = availableSpots.filter(availability => {
    if (!searchTerm) return true
    
    const searchLower = searchTerm.toLowerCase()
    return (
      availability.parking_spots?.spot_number?.toLowerCase().includes(searchLower) ||
      availability.parking_spots?.building_section?.toLowerCase().includes(searchLower) ||
      availability.parking_spots?.profiles?.full_name?.toLowerCase().includes(searchLower) ||
      availability.notes?.toLowerCase().includes(searchLower)
    )
  })

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-900 p-4">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700 animate-pulse">
            <div className="h-8 bg-gray-700 rounded w-1/4 mb-2"></div>
            <div className="h-4 bg-gray-700 rounded w-1/2"></div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="bg-gray-800 rounded-lg p-6 border border-gray-700 animate-pulse">
                <div className="h-6 bg-gray-700 rounded w-3/4 mb-4"></div>
                <div className="h-4 bg-gray-700 rounded w-1/2 mb-2"></div>
                <div className="h-4 bg-gray-700 rounded w-2/3"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-900">
      <div className="max-w-7xl mx-auto p-4 space-y-6">
        {/* Header */}
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-white mb-2">
                Browse Available Spots
              </h1>
              <p className="text-gray-400">
                Find and claim parking spots shared by your neighbors
              </p>
            </div>
            
            {/* Search */}
            <div className="sm:w-80">
              <input
                type="text"
                placeholder="Search by spot number, location, or owner..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder-gray-400"
              />
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <h3 className="text-lg font-semibold text-white mb-2">Total Available</h3>
            <p className="text-3xl font-bold text-green-400">{availableSpots.length}</p>
            <p className="text-sm text-gray-400">Spots currently available</p>
          </div>
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <h3 className="text-lg font-semibold text-white mb-2">Search Results</h3>
            <p className="text-3xl font-bold text-blue-400">{filteredSpots.length}</p>
            <p className="text-sm text-gray-400">Matching your search</p>
          </div>
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <h3 className="text-lg font-semibold text-white mb-2">Active Now</h3>
            <p className="text-3xl font-bold text-yellow-400">
              {availableSpots.filter(a => new Date(a.start_time) <= new Date()).length}
            </p>
            <p className="text-sm text-gray-400">Available right now</p>
          </div>
        </div>

        {/* Available Spots Grid */}
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <h2 className="text-xl font-bold text-white mb-6">Available Parking Spots</h2>
          
          {filteredSpots.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-400 mb-4">
                <svg className="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </div>
              <p className="text-gray-400 text-lg mb-2">
                {searchTerm ? 'No spots match your search' : 'No spots available at the moment'}
              </p>
              <p className="text-gray-500 text-sm">
                {searchTerm ? 'Try adjusting your search terms' : 'Check back later or encourage neighbors to share their spots'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredSpots.map((availability) => (
                <ParkingSpotCard
                  key={availability.id}
                  availability={availability}
                  onClaim={() => handleClaimSpot(availability)}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Claim Modal */}
      {showClaimModal && selectedAvailability && (
        <SpotClaimModal
          availability={selectedAvailability}
          onClaim={() => {
            fetchAvailableSpots()
            setShowClaimModal(false)
            setSelectedAvailability(null)
          }}
          onClose={() => {
            setShowClaimModal(false)
            setSelectedAvailability(null)
          }}
        />
      )}
    </div>
  )
}