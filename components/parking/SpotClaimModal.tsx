'use client'

import { useState } from 'react'
import { getSupabaseClient } from '@/lib/supabase/singleton'
import { AvailabilityWithSpot } from '@/types'

interface SpotClaimModalProps {
  availability: AvailabilityWithSpot
  onClaim?: () => void
  onClose?: () => void
}

export function SpotClaimModal({ availability, onClaim, onClose }: SpotClaimModalProps) {
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const supabase = getSupabaseClient()

  const formatTime = (timeString: string) => {
    return new Date(timeString).toLocaleString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    })
  }

  const getDuration = () => {
    const start = new Date(availability.start_time)
    const end = new Date(availability.end_time)
    const diffHours = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60))
    
    if (diffHours < 24) {
      return `${diffHours} hour${diffHours !== 1 ? 's' : ''}`
    } else {
      const days = Math.ceil(diffHours / 24)
      return `${days} day${days !== 1 ? 's' : ''}`
    }
  }

  const handleClaim = async () => {
    setLoading(true)
    setError('')

    const { data: { session } } = await supabase.auth.getSession()
    const token = session?.access_token

    if (!token) {
      window.location.href = '/login'
      return
    }

    try {
      // Check if availability is still active and not expired
      const now = new Date()
      const endTime = new Date(availability.end_time)
      
      if (!availability.is_active) {
        setError('This spot is no longer available')
        return
      }
      
      if (endTime <= now) {
        setError('This availability window has expired')
        return
      }

      // Create claim
      const response = await fetch('/api/claims', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          availability_id: availability.id,
          notes: notes
        })
      })

if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to claim spot')
      }

      onClaim?.()
      onClose?.()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to claim spot')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md border border-gray-700">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-white">Claim Parking Spot</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Spot Information */}
        <div className="mb-6 p-4 bg-gray-700 rounded-lg">
          <div className="flex justify-between items-start mb-3">
            <div>
              <h3 className="text-lg font-semibold text-white">
                Spot {availability.parking_spots.spot_number}
              </h3>
              {availability.parking_spots.building_section && (
                <p className="text-sm text-gray-400">
                  Section: {availability.parking_spots.building_section}
                </p>
              )}
            </div>
            <span className="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
              Available
            </span>
          </div>

          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-400">Owner:</span>
              <span className="text-white">
                {availability.parking_spots.profiles.full_name} 
                (Apt {availability.parking_spots.profiles.apartment_number})
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Duration:</span>
              <span className="text-white">{getDuration()}</span>
            </div>
            <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
              <div>
                <span className="text-gray-400">From: </span>
                <span className="text-white">{formatTime(availability.start_time)}</span>
              </div>
              <div>
                <span className="text-gray-400">Until: </span>
                <span className="text-white">{formatTime(availability.end_time)}</span>
              </div>
            </div>
          </div>

          {availability.notes && (
            <div className="mt-3 p-3 bg-gray-600 rounded">
              <p className="text-sm text-gray-300">
                <span className="font-medium">Owner Notes:</span> {availability.notes}
              </p>
            </div>
          )}
        </div>

        {error && (
          <div className="mb-4 bg-red-900 border border-red-700 text-red-200 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {/* Claim Form */}
        <div className="mb-6">
          <label htmlFor="notes" className="block text-sm font-medium text-gray-200 mb-2">
            Additional Notes (Optional)
          </label>
          <textarea
            id="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder-gray-400"
            placeholder="Let the owner know when you'll arrive, your car details, etc."
          />
        </div>

        {/* Claim Policy */}
        <div className="mb-6 p-3 bg-blue-900 bg-opacity-50 border border-blue-700 rounded">
          <p className="text-sm text-blue-200">
            <strong>Claim Policy:</strong> Your claim will expire in 2 hours if not confirmed by the owner. 
            You&apos;ll receive notifications about the status of your claim.
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={handleClaim}
            disabled={loading}
            className="flex-1 bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-2 rounded-md font-medium transition-colors"
          >
            {loading ? 'Claiming...' : 'Claim This Spot'}
          </button>
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 bg-gray-600 hover:bg-gray-700 disabled:opacity-50 text-white px-4 py-2 rounded-md font-medium transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}