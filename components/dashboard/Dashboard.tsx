'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { getSupabaseClient } from '@/lib/supabase/singleton'
import { ParkingSpotCard } from '@/components/parking/ParkingSpotCard'
import { AvailabilityToggle } from '@/components/parking/AvailabilityToggle'
import { SpotClaimModal } from '@/components/parking/SpotClaimModal'
import { ParkingSpotWithOwner, AvailabilityWithSpot, ClaimWithDetails } from '@/types'

export function Dashboard() {
  const { user, profile, loading: authLoading } = useAuth()
  const [mySpots, setMySpots] = useState<ParkingSpotWithOwner[]>([])
  const [availableSpots, setAvailableSpots] = useState<AvailabilityWithSpot[]>([])
  const [myClaims, setMyClaims] = useState<ClaimWithDetails[]>([])
  const [loading, setLoading] = useState(true)
  const [showAvailabilityModal, setShowAvailabilityModal] = useState(false)
  const [showClaimModal, setShowClaimModal] = useState(false)
  const [selectedSpot, setSelectedSpot] = useState<string | null>(null)
  const [selectedAvailability, setSelectedAvailability] = useState<AvailabilityWithSpot | null>(null)

  const supabase = getSupabaseClient()

  const fetchData = useCallback(async () => {
    if (!user) return

    try {
      // Try to fetch user's parking spots with simplified query first
      const { data: spots } = await supabase
        .from('parking_spots')
        .select('*')
        .eq('owner_id', user.id)

      setMySpots(spots || [])

      // Try to fetch available spots with simplified query
      const { data: available } = await supabase
        .from('availabilities')
        .select('*')
        .eq('is_active', true)
        .gt('end_time', new Date().toISOString())

      setAvailableSpots(available || [])

      // Try to fetch user's claims with simplified query
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
  }, [user, supabase])

  useEffect(() => {
    if (user) {
      fetchData()
    }
  }, [user, fetchData])

  const handleToggleAvailability = (spotId: string) => {
    setSelectedSpot(spotId)
    setShowAvailabilityModal(true)
  }

  const handleClaimSpot = (availability: AvailabilityWithSpot) => {
    setSelectedAvailability(availability)
    setShowClaimModal(true)
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
          {/* Header skeleton */}
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700 animate-pulse">
            <div className="h-8 bg-gray-700 rounded w-1/4 mb-2"></div>
            <div className="h-4 bg-gray-700 rounded w-1/2"></div>
          </div>

          {/* Stats skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
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

  return (
    <div className="min-h-screen bg-gray-900">
      <div className="max-w-7xl mx-auto p-4 space-y-6">
        {/* Welcome Header */}
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white mb-2">
                Welcome back, {profile?.full_name || user?.email}
              </h1>
              <p className="text-gray-400">
                Manage your parking spots and find available spaces
              </p>
            </div>
            <div className="mt-4 sm:mt-0 flex items-center space-x-2">
              {profile?.is_approved ? (
                <span className="bg-green-100 text-green-800 text-sm font-medium px-3 py-1 rounded-full">
                  Approved
                </span>
              ) : (
                <span className="bg-yellow-100 text-yellow-800 text-sm font-medium px-3 py-1 rounded-full">
                  Pending Approval
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <h3 className="text-lg font-semibold text-white mb-2">My Spots</h3>
            <p className="text-3xl font-bold text-blue-400">{mySpots.length}</p>
            <p className="text-sm text-gray-400">Registered parking spots</p>
          </div>
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <h3 className="text-lg font-semibold text-white mb-2">Available Now</h3>
            <p className="text-3xl font-bold text-green-400">{availableSpots.length}</p>
            <p className="text-sm text-gray-400">Spots available to claim</p>
          </div>
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <h3 className="text-lg font-semibold text-white mb-2">My Claims</h3>
            <p className="text-3xl font-bold text-yellow-400">
              {myClaims.filter(c => c.status === 'pending' || c.status === 'confirmed').length}
            </p>
            <p className="text-sm text-gray-400">Active claims</p>
          </div>
        </div>

        {/* Account Status Warning */}
        {!profile?.is_approved && profile && (
          <div className="bg-yellow-900 bg-opacity-50 border border-yellow-700 rounded-lg p-4">
            <h3 className="text-yellow-200 font-medium mb-2">Account Pending Approval</h3>
            <p className="text-yellow-300 text-sm">
              Your account is currently pending approval from a building administrator. 
              You&apos;ll be able to access all features once your account is approved.
            </p>
          </div>
        )}

        {/* My Parking Spots */}
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-white">My Parking Spots</h2>
            <button 
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
              disabled={!profile?.is_approved}
            >
              Add New Spot
            </button>
          </div>
          
          {mySpots.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-400 mb-4">No parking spots registered yet</p>
              <button 
                className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
                disabled={!profile?.is_approved}
              >
                Register Your First Spot
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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

        {/* Available Spots */}
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-white">Available Spots</h2>
            <button className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors">
              Browse All
            </button>
          </div>
          
          {availableSpots.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-400">No spots available at the moment</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {availableSpots.slice(0, 6).map((availability) => (
                <ParkingSpotCard
                  key={availability.id}
                  availability={availability}
                  onClaim={() => handleClaimSpot(availability)}
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
              {myClaims.slice(0, 5).map((claim) => (
                <div key={claim.id} className="bg-gray-700 rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold text-white">
                        Spot {claim.availabilities.parking_spots.spot_number}
                      </h3>
                      <p className="text-sm text-gray-400">
                        Owner: {claim.availabilities.parking_spots.profiles.full_name}
                      </p>
                      <p className="text-sm text-gray-400">
                        Claimed: {new Date(claim.created_at).toLocaleDateString()}
                      </p>
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

      {/* Modals */}
      {showAvailabilityModal && selectedSpot && (
        <AvailabilityToggle
          spotId={selectedSpot}
          onUpdate={() => {
            fetchData()
            setShowAvailabilityModal(false)
            setSelectedSpot(null)
          }}
          onClose={() => {
            setShowAvailabilityModal(false)
            setSelectedSpot(null)
          }}
        />
      )}

      {showClaimModal && selectedAvailability && (
        <SpotClaimModal
          availability={selectedAvailability}
          onClaim={() => {
            fetchData()
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