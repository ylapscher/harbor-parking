'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { getSupabaseClient } from '@/lib/supabase/singleton'
import { ParkingSpotCard } from '@/components/parking/ParkingSpotCard'
import { AvailabilityToggle } from '@/components/parking/AvailabilityToggle'
import { ParkingSpotWithOwner, ClaimWithDetails } from '@/types'

export default function MySpots() {
  const { user, profile, loading: authLoading } = useAuth()
  const [mySpots, setMySpots] = useState<ParkingSpotWithOwner[]>([])
  const [myClaims, setMyClaims] = useState<ClaimWithDetails[]>([])
  const [loading, setLoading] = useState(true)
  const [showAvailabilityModal, setShowAvailabilityModal] = useState(false)
  const [selectedSpot, setSelectedSpot] = useState<string | null>(null)
  const [showAddSpotForm, setShowAddSpotForm] = useState(false)
  const [newSpotData, setNewSpotData] = useState({
    spotNumber: '',
    location: '',
    notes: ''
  })

  const supabase = getSupabaseClient()

  const fetchMyData = async () => {
    if (!user) return

    try {
      // Fetch user's parking spots
      const { data: spots } = await supabase
        .from('parking_spots')
        .select('*')
        .eq('owner_id', user.id)
        .order('spot_number', { ascending: true })

      setMySpots(spots || [])

      // Fetch user's claims
      const { data: claims } = await supabase
        .from('claims')
        .select('*')
        .eq('claimer_id', user.id)
        .order('created_at', { ascending: false })

      setMyClaims(claims || [])
    } catch {
      // Handle errors silently
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (user) {
      fetchMyData()
    }
  }, [user])

  const handleToggleAvailability = (spotId: string) => {
    setSelectedSpot(spotId)
    setShowAvailabilityModal(true)
  }

  const handleAddSpot = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !profile?.is_approved) return

    try {
      const { error } = await supabase
        .from('parking_spots')
        .insert({
          owner_id: user.id,
          spot_number: newSpotData.spotNumber,
          location: newSpotData.location,
          notes: newSpotData.notes || null
        })

      if (error) throw error

      // Reset form and refresh data
      setNewSpotData({ spotNumber: '', location: '', notes: '' })
      setShowAddSpotForm(false)
      fetchMyData()
    } catch (err) {
      console.error('Failed to add spot:', err)
    }
  }

  const getClaimStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'confirmed': return 'bg-green-100 text-green-800'
      case 'expired': return 'bg-gray-100 text-gray-800'
      case 'cancelled': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-900 p-4">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700 animate-pulse">
            <div className="h-8 bg-gray-700 rounded w-1/4 mb-2"></div>
            <div className="h-4 bg-gray-700 rounded w-1/2"></div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
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
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white mb-2">
                My Parking Spots
              </h1>
              <p className="text-gray-400">
                Manage your registered parking spots and availability
              </p>
            </div>
            <div className="mt-4 sm:mt-0">
              <button
                onClick={() => setShowAddSpotForm(true)}
                disabled={!profile?.is_approved}
                className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
              >
                Add New Spot
              </button>
            </div>
          </div>
        </div>

        {/* Account Status Warning */}
        {!profile?.is_approved && profile && (
          <div className="bg-yellow-900 bg-opacity-50 border border-yellow-700 rounded-lg p-4">
            <h3 className="text-yellow-200 font-medium mb-2">Account Pending Approval</h3>
            <p className="text-yellow-300 text-sm">
              Your account is currently pending approval. You&apos;ll be able to add and manage parking spots once approved.
            </p>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <h3 className="text-lg font-semibold text-white mb-2">My Spots</h3>
            <p className="text-3xl font-bold text-blue-400">{mySpots.length}</p>
            <p className="text-sm text-gray-400">Registered parking spots</p>
          </div>
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <h3 className="text-lg font-semibold text-white mb-2">Active Claims</h3>
            <p className="text-3xl font-bold text-yellow-400">
              {myClaims.filter(c => c.status === 'pending' || c.status === 'confirmed').length}
            </p>
            <p className="text-sm text-gray-400">Claims you&apos;ve made</p>
          </div>
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <h3 className="text-lg font-semibold text-white mb-2">Total Claims</h3>
            <p className="text-3xl font-bold text-green-400">{myClaims.length}</p>
            <p className="text-sm text-gray-400">All time claims</p>
          </div>
        </div>

        {/* My Parking Spots */}
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <h2 className="text-xl font-bold text-white mb-6">My Parking Spots</h2>
          
          {mySpots.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-400 mb-4">
                <svg className="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <p className="text-gray-400 text-lg mb-4">No parking spots registered yet</p>
              <p className="text-gray-500 text-sm mb-6">Start by adding your first parking spot to share with neighbors</p>
              <button
                onClick={() => setShowAddSpotForm(true)}
                disabled={!profile?.is_approved}
                className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-3 rounded-md font-medium transition-colors"
              >
                Register Your First Spot
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {mySpots.map((spot) => (
                <ParkingSpotCard
                  key={spot.id}
                  spot={spot}
                  isOwner={true}
                  onToggleAvailability={handleToggleAvailability}
                />
              ))}
            </div>
          )}
        </div>

        {/* My Claims */}
        {myClaims.length > 0 && (
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <h2 className="text-xl font-bold text-white mb-6">My Claims</h2>
            <div className="space-y-4">
              {myClaims.map((claim) => (
                <div key={claim.id} className="bg-gray-700 rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold text-white">
                        Spot {claim.availabilities?.parking_spots?.spot_number || 'Unknown'}
                      </h3>
                      <p className="text-sm text-gray-400">
                        Owner: {claim.availabilities?.parking_spots?.profiles?.full_name || 'Unknown'}
                      </p>
                      <p className="text-sm text-gray-400">
                        Claimed: {new Date(claim.created_at).toLocaleDateString()}
                      </p>
                      {claim.notes && (
                        <p className="text-sm text-gray-300 mt-2">
                          Notes: {claim.notes}
                        </p>
                      )}
                    </div>
                    <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${getClaimStatusColor(claim.status)}`}>
                      {claim.status.charAt(0).toUpperCase() + claim.status.slice(1)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Add Spot Modal */}
      {showAddSpotForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md border border-gray-700">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-white">Add New Parking Spot</h2>
              <button
                onClick={() => setShowAddSpotForm(false)}
                className="text-gray-400 hover:text-white"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleAddSpot} className="space-y-4">
              <div>
                <label htmlFor="spotNumber" className="block text-sm font-medium text-gray-200 mb-1">
                  Spot Number *
                </label>
                <input
                  id="spotNumber"
                  type="text"
                  value={newSpotData.spotNumber}
                  onChange={(e) => setNewSpotData(prev => ({ ...prev, spotNumber: e.target.value }))}
                  required
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., A-15, 42, Garage Spot 3"
                />
              </div>

              <div>
                <label htmlFor="location" className="block text-sm font-medium text-gray-200 mb-1">
                  Location *
                </label>
                <input
                  id="location"
                  type="text"
                  value={newSpotData.location}
                  onChange={(e) => setNewSpotData(prev => ({ ...prev, location: e.target.value }))}
                  required
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., Level 2 Parking Garage, Building A Lot"
                />
              </div>

              <div>
                <label htmlFor="notes" className="block text-sm font-medium text-gray-200 mb-1">
                  Notes (Optional)
                </label>
                <textarea
                  id="notes"
                  value={newSpotData.notes}
                  onChange={(e) => setNewSpotData(prev => ({ ...prev, notes: e.target.value }))}
                  rows={3}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder-gray-400"
                  placeholder="Any special instructions or details about the spot..."
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-medium transition-colors"
                >
                  Add Spot
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddSpotForm(false)}
                  className="flex-1 bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md font-medium transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Availability Modal */}
      {showAvailabilityModal && selectedSpot && (
        <AvailabilityToggle
          spotId={selectedSpot}
          onUpdate={() => {
            fetchMyData()
            setShowAvailabilityModal(false)
            setSelectedSpot(null)
          }}
          onClose={() => {
            setShowAvailabilityModal(false)
            setSelectedSpot(null)
          }}
        />
      )}
    </div>
  )
}