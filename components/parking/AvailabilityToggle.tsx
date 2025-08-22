'use client'

import { createSupabaseBrowserClient } from '@/lib/supabase/client'
import { useState } from 'react'

interface AvailabilityToggleProps {
  spotId: string
  currentAvailability?: {
    id: string
    start_time: string
    end_time: string
    notes?: string
    is_active: boolean
  }
  spotVerified?: boolean
  onUpdate?: () => void
  onClose?: () => void
}

export function AvailabilityToggle({ 
  spotId, 
  currentAvailability, 
  spotVerified = true,
  onUpdate,
  onClose 
}: AvailabilityToggleProps) {
  const [formData, setFormData] = useState({
    startTime: currentAvailability?.start_time?.slice(0, 16) || '',
    endTime: currentAvailability?.end_time?.slice(0, 16) || '',
    notes: currentAvailability?.notes || '',
    isActive: currentAvailability?.is_active ?? true
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const supabase = createSupabaseBrowserClient()

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target
    
    if (type === 'checkbox' && name === 'isActive') {
      const isChecked = (e.target as HTMLInputElement).checked
      setFormData(prev => ({
        ...prev,
        isActive: isChecked,
        // If making immediately available, set start time to now
        startTime: isChecked ? new Date().toISOString().slice(0, 16) : prev.startTime
      }))
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { data: { session } } = await supabase.auth.getSession()
    const token = session?.access_token

    if (!token) {
      window.location.href = '/login'
      return
    }

    try {
      // Debug logging
      console.log('Form data:', formData)
      console.log('Spot verified:', spotVerified)
      
      // Check if spot is verified
      if (!spotVerified) {
        setError('Cannot create availability for unverified parking spots. Please wait for admin approval.')
        return
      }
      
      // Validate required fields
      if (!formData.startTime) {
        setError('Start time is required')
        return
      }
      
      if (!formData.endTime) {
        setError('End time is required')
        return
      }
      
      // Validate times
      const startDate = new Date(formData.startTime)
      const endDate = new Date(formData.endTime)
      
      if (isNaN(startDate.getTime())) {
        setError('Invalid start time format')
        return
      }
      
      if (isNaN(endDate.getTime())) {
        setError('Invalid end time format')
        return
      }
      
      if (endDate <= startDate) {
        setError('End time must be after start time')
        return
      }

      // Only validate start time if not making immediately available
      if (!formData.isActive && startDate < new Date()) {
        setError('Start time cannot be in the past')
        return
      }

      if (currentAvailability) {
        // Update existing availability
        const response = await fetch('/api/availabilities', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            id: currentAvailability.id,
            start_time: new Date(formData.startTime).toISOString(),
            end_time: new Date(formData.endTime).toISOString(),
            notes: formData.notes,
            is_active: formData.isActive
          })
        })

if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || 'Failed to update availability')
        }
      } else {
        // Create new availability
        const response = await fetch('/api/availabilities', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            spot_id: spotId,
            start_time: new Date(formData.startTime).toISOString(),
            end_time: new Date(formData.endTime).toISOString(),
            notes: formData.notes,
            is_active: formData.isActive
          })
        })

        if (!response.ok) {
          const errorData = await response.json()
          console.error('API Error:', errorData)
          throw new Error(errorData.error || errorData.details || 'Failed to create availability')
        }
      }

      onUpdate?.()
      onClose?.()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to update availability')
    } finally {
      setLoading(false)
    }
  }

  const handleDeactivate = async () => {
    if (!currentAvailability) return
    
    setLoading(true)
    const { data: { session } } = await supabase.auth.getSession()
    const token = session?.access_token

    if (!token) {
      window.location.href = '/login'
      return
    }

    try {
      const response = await fetch('/api/availabilities', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          id: currentAvailability.id,
          is_active: false
        })
      })

if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to deactivate availability')
      }
      onUpdate?.()
      onClose?.()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to deactivate availability')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md border border-gray-700">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-white">
            {currentAvailability ? 'Update Availability' : 'Set Availability'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {!spotVerified && (
            <div className="bg-yellow-900 border border-yellow-700 text-yellow-200 px-4 py-3 rounded">
              This parking spot is pending admin approval. You cannot create availabilities until it is verified.
            </div>
          )}
          
          {error && (
            <div className="bg-red-900 border border-red-700 text-red-200 px-4 py-3 rounded">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="startTime" className="block text-sm font-medium text-gray-200 mb-1">
              Start Time
            </label>
            <input
              id="startTime"
              name="startTime"
              type="datetime-local"
              value={formData.startTime}
              onChange={handleInputChange}
              disabled={formData.isActive}
              required={!formData.isActive}
              className={`w-full px-3 py-2 bg-gray-700 border border-gray-600 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                formData.isActive ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            />
          </div>

          <div>
            <label htmlFor="endTime" className="block text-sm font-medium text-gray-200 mb-1">
              End Time
            </label>
            <input
              id="endTime"
              name="endTime"
              type="datetime-local"
              value={formData.endTime}
              onChange={handleInputChange}
              required
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label htmlFor="notes" className="block text-sm font-medium text-gray-200 mb-1">
              Notes (Optional)
            </label>
            <textarea
              id="notes"
              name="notes"
              value={formData.notes}
              onChange={handleInputChange}
              rows={3}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder-gray-400"
              placeholder="Any special instructions or notes..."
            />
          </div>

          <div className="flex items-center">
            <input
              id="isActive"
              name="isActive"
              type="checkbox"
              checked={formData.isActive}
              onChange={handleInputChange}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-600 bg-gray-700 rounded"
            />
            <label htmlFor="isActive" className="ml-2 block text-sm text-gray-200">
              Make immediately available
            </label>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <button
              type="submit"
              disabled={loading || !spotVerified}
              className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-2 rounded-md font-medium transition-colors"
            >
              {loading ? 'Saving...' : (currentAvailability ? 'Update' : 'Set Available')}
            </button>
            
            {currentAvailability && currentAvailability.is_active && (
              <button
                type="button"
                onClick={handleDeactivate}
                disabled={loading}
                className="flex-1 bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-2 rounded-md font-medium transition-colors"
              >
                Deactivate
              </button>
            )}
            
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 bg-gray-600 hover:bg-gray-700 disabled:opacity-50 text-white px-4 py-2 rounded-md font-medium transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}