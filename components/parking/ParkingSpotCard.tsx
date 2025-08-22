'use client'

import { useState, useEffect } from 'react'
import { ParkingSpotWithOwner, AvailabilityWithSpot } from '@/types'
import { createSupabaseBrowserClient } from '@/lib/supabase/client'

interface ParkingSpotCardProps {
  spot?: ParkingSpotWithOwner
  availability?: AvailabilityWithSpot
  onClaim?: (availabilityId: string) => Promise<void>
  onToggleAvailability?: (spotId: string) => void
  onDeleteSpot?: (spotId: string) => void
  isOwner?: boolean
  showActions?: boolean
  loading?: boolean
  disabled?: boolean
}

export function ParkingSpotCard({
  spot,
  availability,
  onClaim,
  onToggleAvailability,
  onDeleteSpot,
  isOwner = false,
  showActions = true,
  loading = false,
  disabled = false
}: ParkingSpotCardProps) {
  const [claiming, setClaiming] = useState(false)
  const [hasConfirmedClaim, setHasConfirmedClaim] = useState(false)
  const [checkingClaims, setCheckingClaims] = useState(false)

  const supabase = createSupabaseBrowserClient()

  // Check if there are any confirmed claims for this availability
  useEffect(() => {
    if (!availability || isOwner) return

    const checkConfirmedClaims = async () => {
      setCheckingClaims(true)
      try {
        const { data: claims } = await supabase
          .from('claims')
          .select('id')
          .eq('availability_id', availability.id)
          .eq('status', 'confirmed')
        
        setHasConfirmedClaim(Boolean(claims && claims.length > 0))
      } catch (error) {
        console.error('Error checking claims:', error)
      } finally {
        setCheckingClaims(false)
      }
    }

    checkConfirmedClaims()
  }, [availability, isOwner, supabase])

  const handleClaim = async () => {
    if (!availability || !onClaim) return
    setClaiming(true)
    try {
      await onClaim(availability.id)
    } finally {
      setClaiming(false)
    }
  }

  const spotData = spot || availability?.parking_spots
  if (!spotData) return null

  const formatTime = (timeString: string) => {
    const date = new Date(timeString)
    const now = new Date()
    const isToday = date.toDateString() === now.toDateString()
    const isTomorrow = date.toDateString() === new Date(now.getTime() + 24 * 60 * 60 * 1000).toDateString()
    
    const timeStr = date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    })
    
    if (isToday) {
      return `Today at ${timeStr}`
    } else if (isTomorrow) {
      return `Tomorrow at ${timeStr}`
    } else {
      return date.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      })
    }
  }

  const isAvailable = availability?.is_active && new Date(availability.end_time) > new Date()
  const isExpired = availability && new Date(availability.end_time) <= new Date()

  if (loading) {
    return (
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700 animate-pulse">
        <div className="flex justify-between items-start mb-4">
          <div className="h-6 bg-gray-700 rounded w-20"></div>
          <div className="h-5 bg-gray-700 rounded w-16"></div>
        </div>
        <div className="space-y-2">
          <div className="h-4 bg-gray-700 rounded w-3/4"></div>
          <div className="h-4 bg-gray-700 rounded w-1/2"></div>
        </div>
        <div className="mt-4 h-10 bg-gray-700 rounded"></div>
      </div>
    )
  }

  return (
    <div className="bg-gray-800 rounded-lg p-6 border border-gray-700 hover:border-gray-600 transition-colors">
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center space-x-2">
          <h3 className="text-lg font-semibold text-white">
            Spot {spotData.spot_number}
          </h3>
          {spotData.location && (
            <span className="text-sm text-gray-400">
              ({spotData.location})
            </span>
          )}
        </div>
        
        {/* Status indicator */}
        <div className="flex items-center space-x-2">
          {isOwner && (
            <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
              Your Spot
            </span>
          )}
          {availability && (
            <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${
              hasConfirmedClaim
                ? 'bg-red-100 text-red-800'
                : isAvailable 
                ? 'bg-green-100 text-green-800' 
                : isExpired
                ? 'bg-gray-100 text-gray-800'
                : 'bg-red-100 text-red-800'
            }`}>
              {hasConfirmedClaim ? 'Claimed' : isAvailable ? 'Available' : isExpired ? 'Expired' : 'Unavailable'}
            </span>
          )}
        </div>
      </div>

      {/* Owner info */}
      {!isOwner && spotData.profiles && (
        <div className="mb-3">
          <p className="text-sm text-gray-400">
            Owner: {spotData.profiles.full_name} (Apt {spotData.profiles.apartment_number})
          </p>
        </div>
      )}

      {/* Availability info */}
      {availability && (
        <div className="mb-4 p-3 bg-gray-700 rounded-md">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-300">Available Window</span>
          </div>
          <div className="text-sm text-gray-400">
            <div className="flex flex-col space-y-1">
              <span>Available from {formatTime(availability.start_time)}</span>
              <span>until {formatTime(availability.end_time)}</span>
            </div>
          </div>
          {availability.notes && (
            <div className="mt-2 text-sm text-gray-400">
              <span className="font-medium">Notes:</span> {availability.notes}
            </div>
          )}
        </div>
      )}

      {/* Actions */}
      {showActions && (
        <div className="flex flex-col sm:flex-row gap-2">
          {isOwner ? (
            <>
              <button
                onClick={() => onToggleAvailability?.(spotData.id)}
                disabled={!spotData.is_verified}
                title={!spotData.is_verified ? 'Spot pending admin approval' : ''}
                className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  spotData.is_verified 
                    ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                    : 'bg-gray-500 text-gray-300 cursor-not-allowed'
                }`}
              >
                {availability?.is_active ? 'Update Availability' : 'Set Available'}
              </button>
              <button
                onClick={() => {
                  if (!onDeleteSpot) return
                  if (confirm(`Remove Spot ${spotData.spot_number}? This cannot be undone.`)) {
                    onDeleteSpot(spotData.id)
                  }
                }}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
              >
                Remove Spot
              </button>
            </>
          ) : (
            <>
              {availability && isAvailable && !hasConfirmedClaim && (
                <button
                  onClick={handleClaim}
                  disabled={claiming || hasConfirmedClaim || checkingClaims || disabled}
                  className="flex-1 bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  {claiming ? 'Claiming...' : checkingClaims ? 'Checking...' : hasConfirmedClaim ? 'Claimed' : 'Claim Spot'}
                </button>
              )}
              {availability && isAvailable && hasConfirmedClaim && (
                <div className="flex-1 bg-red-600 text-white px-4 py-2 rounded-md text-sm font-medium text-center">
                  Already Claimed
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}