'use client'

import { useState, useEffect, useCallback } from 'react'
import { createSupabaseBrowserClient } from '@/lib/supabase/client'
import { ParkingSpotCard } from '@/components/parking/ParkingSpotCard'
import { AvailabilityToggle } from '@/components/parking/AvailabilityToggle'
import { SpotClaimModal } from '@/components/parking/SpotClaimModal'
import { ParkingSpotWithOwner, AvailabilityWithSpot, ClaimWithDetails } from '@/types'
import { useAuth } from '../providers/AuthProvider'

export function Dashboard() {
  const { user, profile, loading: authLoading } = useAuth()!
  const [mySpots, setMySpots] = useState<ParkingSpotWithOwner[]>([])
  const [availableSpots, setAvailableSpots] = useState<AvailabilityWithSpot[]>([])
  const [myClaims, setMyClaims] = useState<ClaimWithDetails[]>([])
  const [loading, setLoading] = useState(true)
  const [showAvailabilityModal, setShowAvailabilityModal] = useState(false)
  const [showClaimModal, setShowClaimModal] = useState(false)
  const [showAddSpotForm, setShowAddSpotForm] = useState(false)
  const [selectedSpot, setSelectedSpot] = useState<string | null>(null)
  const [selectedSpotVerified, setSelectedSpotVerified] = useState<boolean>(true)
  const [selectedAvailability, setSelectedAvailability] = useState<AvailabilityWithSpot | null>(null)
  const [newSpotData, setNewSpotData] = useState({
    spotNumber: '',
    nearestElevator: '',
  })
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const supabase = createSupabaseBrowserClient()

  const fetchData = useCallback(async () => {
    if (!user) return

    // Check if we're in dev mode with dev user
    // const isDevMode = process.env.NODE_ENV === 'development' && user.id === 'dev-user-id'
    
    // if (isDevMode) {
    //   // Use mock data for development
    //   console.log('🚀 Using mock data for development dashboard')
      
    //   const mockSpots = [
    //     {
    //       id: 'mock-spot-1',
    //       spot_number: 'A101',
    //       owner_id: 'dev-user-id',
    //       is_active: true,
    //       location: 'Dev One',
    //       description: "Dev One's parking spot",
    //       profiles: {
    //         full_name: "Dev One",
    //         apartment_number: "101",
    //         email: "dev-one@example.com",
    //       },
    //       created_at: new Date().toISOString(),
    //       updated_at: new Date().toISOString(),
    //     }
    //   ]
      
    //   const mockAvailable = [
    //     {
    //       id: 'mock-availability-1',
    //       spot_id: 'mock-spot-2',
    //       start_time: new Date(Date.now() + 3600000).toISOString(), // 1 hour from now
    //       end_time: new Date(Date.now() + 7200000).toISOString(), // 2 hours from now
    //       notes: 'Available for visitors',
    //       is_active: true,
    //       created_at: new Date().toISOString(),
    //       updated_at: new Date().toISOString(),
    //       parking_spots: {
    //         id: 'mock-spot-2',
    //         spot_number: 'B205',
    //         owner_id: 'other-user-id',
    //         is_verified: true,
    //         profiles: {
    //           full_name: "John Doe",
    //           apartment_number: "205",
    //           email: "john-doe@example.com",
    //         },
    //         created_at: new Date().toISOString(),
    //         updated_at: new Date().toISOString(),
    //       }
    //     }
    //   ]
      
    //   const mockClaims = [
    //     {
    //       id: 'mock-claim-1',
    //       availability_id: 'mock-availability-2',
    //       claimer_id: 'dev-user-id',
    //       status: 'pending' as const,
    //       notes: "",
    //       profiles: {
    //         full_name: "John Doe",
    //         apartment_number: "205",
    //         email: "john-doe@example.com",
    //       },
    //       created_at: new Date().toISOString(),
    //       updated_at: new Date().toISOString(),
    //       availabilities: mockAvailable[0],
    //       claimed_at: new Date().toISOString(),
    //       expires_at: new Date().toISOString(),
    //     }
    //   ]
      
    //   setMySpots(mockSpots)
    //   setAvailableSpots(mockAvailable)
    //   setMyClaims(mockClaims)
    //   setLoading(false)
    //   return
    // }

    try {
      // Fetch user's parking spots with owner profile info
      const { data: spots } = await supabase
        .from('parking_spots')
        .select(`
          *,
          profiles!parking_spots_owner_id_fkey(
            full_name,
            apartment_number,
            email
          )
        `)
        .eq('owner_id', user.id)
        .order('spot_number', { ascending: true })

      setMySpots(spots || [])

      // Try to fetch available spots with proper joins
      const { data: available } = await supabase
        .from('availabilities')
        .select(`
          *,
          parking_spots!inner (
            *,
            profiles!inner (
              id,
              full_name,
              apartment_number,
              email
            )
          )
        `)
        .eq('is_active', true)
        .gt('end_time', new Date().toISOString())
        .eq('parking_spots.is_verified', true) // Only show verified spots
        .neq('parking_spots.owner_id', user.id)
        .order('start_time', { ascending: true })

      // Get all confirmed claims to filter out claimed availabilities
      const { data: confirmedClaims } = await supabase
        .from('claims')
        .select('availability_id')
        .eq('status', 'confirmed')

      // Filter out availabilities that have confirmed claims
      const claimedAvailabilityIds = new Set(confirmedClaims?.map(claim => claim.availability_id) || [])
      const availableSpots = available?.filter(availability => 
        !claimedAvailabilityIds.has(availability.id)
      ) || []

      setAvailableSpots(availableSpots)

      // Fetch user's claims with related availability and spot owner details
      const { data: claims } = await supabase
        .from('claims')
        .select(`
          *,
          profiles!claims_claimer_id_fkey(
            full_name,
            apartment_number,
            email
          ),
          availabilities!inner (
            *,
            parking_spots!inner (
              *,
              profiles!inner (
                id,
                full_name,
                apartment_number,
                email
              )
            )
          )
        `)
        .eq('claimer_id', user.id)
        .order('created_at', { ascending: false })

      setMyClaims(claims || [])
} catch (error) {
      console.error('Error fetching dashboard data:', error)
      setError('Failed to load dashboard data. Please refresh the page.')
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
    // Find the spot to get its verification status
    const spot = mySpots.find(s => s.id === spotId)
    setSelectedSpot(spotId)
    setSelectedSpotVerified(spot?.is_verified ?? false)
    setShowAvailabilityModal(true)
  }



  const handleReleaseClaim = async (claimId: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        window.location.href = '/login'
        return
      }

      const response = await fetch('/api/claims', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          id: claimId,
          action: 'release'
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to release spot')
      }

      // Refresh dashboard data
      await fetchData()
      setSuccess('Spot released successfully!')
      setTimeout(() => setSuccess(null), 3000)
    } catch (err) {
      console.error('Failed to release spot:', err)
      setError((err as Error).message)
      setTimeout(() => setError(null), 5000)
    }
  }

  const handleDeleteSpot = async (spotId: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        window.location.href = '/login'
        return
      }

      const response = await fetch('/api/parking-spots?id=' + encodeURIComponent(spotId), {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to delete spot')
      }

      // Refresh dashboard data
      await fetchData()
    } catch (err) {
      console.error('Failed to delete spot:', err)
      alert((err as Error).message)
    }
  }

  const handleAddSpot = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !profile?.is_approved) return

    setError(null)
    setSuccess(null)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        window.location.href = '/login'
        return
      }

      // Use the API route instead of direct Supabase call
      // const response = await fetch('/api/parking-spots', {
      //   method: 'POST',
      //   headers: {
      //     'Content-Type': 'application/json',
      //     'Authorization': `Bearer ${token}`
      //   },
      //   body: JSON.stringify({
      //     spot_number: newSpotData.spotNumber,
      //     location: newSpotData.nearestElevator,
      //     notes: '' // Optional field
      //   })
      // })

      const { error } = await supabase
        .from('parking_spots')
        .insert([
          {
            spot_number: newSpotData.spotNumber,
            location: newSpotData.nearestElevator,
            description: '',
            owner_id: user.id,
          }
        ])
        .select()

      if (error) {
        console.error("Error trying to add new parking spot:", error)
        setError(error.message)
        // const errorData = await response.json()
        // if (response.status === 409) {
        //   setError('A parking spot with this number already exists. Please use a different spot number.')
        // } else {
        //   setError(errorData.error || 'Failed to add parking spot')
        // }
        return
      }

      // await response.json() // Get the response but don't store it since we refresh data anyway

      // Reset form and refresh data
      setNewSpotData({ spotNumber: '', nearestElevator: '' })
      setSuccess('Parking spot added successfully!')
      setTimeout(() => {
        setShowAddSpotForm(false)
        setSuccess(null)
      }, 1500)
      fetchData()
    } catch (err) {
      console.error('Failed to add spot:', err)
      setError('An unexpected error occurred. Please try again.')
    }
  }

  const getClaimStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'confirmed': return 'bg-green-100 text-green-800'
      case 'released': return 'bg-blue-100 text-blue-800'
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
              {myClaims.filter(c => c.status === 'confirmed').length}
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

        {/* Pending Spot Approvals Warning */}
        {mySpots.some(spot => !spot.is_verified) && (
          <div className="bg-blue-900 bg-opacity-50 border border-blue-700 rounded-lg p-4">
            <h3 className="text-blue-200 font-medium mb-2">Parking Spots Pending Approval</h3>
            <p className="text-blue-300 text-sm">
              You have {mySpots.filter(spot => !spot.is_verified).length} parking spot(s) pending approval from an administrator. 
              These spots will be available for sharing once approved.
            </p>
          </div>
        )}

        {/* My Parking Spots */}
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-white">My Parking Spots</h2>
            <button 
              onClick={() => {
                setShowAddSpotForm(true)
                setError(null)
                setSuccess(null)
              }}
              className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
              disabled={!profile?.is_approved}
            >
              Add New Spot
            </button>
          </div>
          
          {mySpots.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-400 mb-4">No parking spots registered yet</p>
              <button 
                onClick={() => {
                  setShowAddSpotForm(true)
                  setError(null)
                  setSuccess(null)
                }}
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
                  onDeleteSpot={handleDeleteSpot}
                />
              ))}
            </div>
          )}
        </div>

        {/* Available Spots */}
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-white">Available Spots</h2>
            <span className="text-sm text-gray-400">
              {availableSpots.length} spots available
            </span>
          </div>
          
          {availableSpots.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-400">No spots available at the moment</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {availableSpots.map((availability) => (
                <ParkingSpotCard
                  key={availability.id}
                  availability={availability}
                  disabled={!profile?.is_approved}
                  onClaim={() => {
                    fetchData()
                    setSuccess('Spot claimed successfully!')
                    setTimeout(() => setSuccess(null), 3000)
                    setShowClaimModal(false)
                    setSelectedAvailability(null)
                  }}
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
                        Spot {claim.availabilities?.parking_spots.spot_number}
                      </h3>
                      <p className="text-sm text-gray-400">
                        Owner: {claim.availabilities?.parking_spots.profiles.full_name}
                      </p>
                      <p className="text-sm text-gray-400">
                        Claimed: {new Date(claim.created_at!).toLocaleDateString()}
                      </p>
                      {claim.status === 'confirmed' && (
                        <p className="text-sm text-gray-400">
                          Available until: {new Date(claim.availabilities?.end_time || '').toLocaleString()}
                        </p>
                      )}
                    </div>
                    <div className="flex flex-col items-end space-y-2">
                      <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${getClaimStatusColor(claim.status!)}`}>
                        {claim.status!.charAt(0).toUpperCase() + claim.status!.slice(1)}
                      </span>
                      {claim.status === 'confirmed' && (
                        <button
                          onClick={() => handleReleaseClaim(claim.id)}
                          className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-xs font-medium transition-colors"
                        >
                          Release Spot
                        </button>
                      )}
                    </div>
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
          spotVerified={selectedSpotVerified}
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
            setSuccess('Spot claimed successfully!')
            setTimeout(() => setSuccess(null), 3000)
            setShowClaimModal(false)
            setSelectedAvailability(null)
          }}
          onClose={() => {
            setShowClaimModal(false)
            setSelectedAvailability(null)
          }}
        />
      )}

      {/* Add Spot Modal */}
      {showAddSpotForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md border border-gray-700">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-white">Add New Parking Spot</h2>
              <button
                onClick={() => {
                  setShowAddSpotForm(false)
                  setError(null)
                  setSuccess(null)
                }}
                className="text-gray-400 hover:text-white"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-900 bg-opacity-50 border border-red-700 rounded-md">
                <p className="text-red-200 text-sm">{error}</p>
              </div>
            )}

            {success && (
              <div className="mb-4 p-3 bg-green-900 bg-opacity-50 border border-green-700 rounded-md">
                <p className="text-green-200 text-sm">{success}</p>
              </div>
            )}

            <form onSubmit={handleAddSpot} className="space-y-4">
              <div>
                <label htmlFor="spotNumber" className="block text-sm font-medium text-gray-200 mb-1">
                  Parking Spot Number *
                </label>
                <input
                  id="spotNumber"
                  type="text"
                  value={newSpotData.spotNumber}
                  onChange={(e) => setNewSpotData(prev => ({ ...prev, spotNumber: e.target.value }))}
                  required
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., 42, A15, Garage-5"
                />
              </div>

              <div>
                <label htmlFor="nearestElevator" className="block text-sm font-medium text-gray-200 mb-1">
                  Nearest Elevator *
                </label>
                <select
                  id="nearestElevator"
                  value={newSpotData.nearestElevator}
                  onChange={(e) => setNewSpotData(prev => ({ ...prev, nearestElevator: e.target.value }))}
                  required
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select nearest elevator</option>
                  <option value="Elevator 1">Elevator 1</option>
                  <option value="Elevator 2">Elevator 2</option>
                  <option value="Elevator 3">Elevator 3</option>
                  <option value="Elevator 4">Elevator 4</option>
                </select>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-medium transition-colors"
                >
                  Add Parking Spot
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowAddSpotForm(false)
                    setError(null)
                    setSuccess(null)
                  }}
                  className="flex-1 bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md font-medium transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}