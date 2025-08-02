'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { getSupabaseClient } from '@/lib/supabase/singleton'

export function UserProfile() {
  const { user, profile, refreshProfile } = useAuth()
  const [formData, setFormData] = useState({
    fullName: '',
    apartmentNumber: '',
    phoneNumber: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const supabase = getSupabaseClient()

  useEffect(() => {
    if (profile) {
      setFormData({
        fullName: profile.full_name || '',
        apartmentNumber: profile.apartment_number || '',
        phoneNumber: profile.phone_number || ''
      })
    }
  }, [profile])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    try {
      if (!user) {
        setError('You must be logged in to update your profile')
        return
      }

      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: formData.fullName,
          phone_number: formData.phoneNumber || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id)

      if (error) throw error

      setSuccess('Profile updated successfully!')
      await refreshProfile()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to update profile')
    } finally {
      setLoading(false)
    }
  }

  const handlePasswordReset = async () => {
    if (!user?.email) return

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
        redirectTo: `${window.location.origin}/reset-password`
      })

      if (error) throw error
      setSuccess('Password reset email sent! Check your inbox.')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to send password reset email')
    }
  }

  if (!user || !profile) {
    return (
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-700 rounded w-1/4"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-700 rounded w-3/4"></div>
            <div className="h-4 bg-gray-700 rounded w-1/2"></div>
            <div className="h-4 bg-gray-700 rounded w-2/3"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Account Status */}
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <h2 className="text-xl font-bold text-white mb-4">Account Status</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">Email</label>
            <p className="text-white">{user.email}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">Account Status</label>
            <div className="flex items-center space-x-2">
              {profile.is_approved ? (
                <span className="bg-green-100 text-green-800 text-sm font-medium px-3 py-1 rounded-full">
                  Approved
                </span>
              ) : (
                <span className="bg-yellow-100 text-yellow-800 text-sm font-medium px-3 py-1 rounded-full">
                  Pending Approval
                </span>
              )}
              {profile.is_admin && (
                <span className="bg-blue-100 text-blue-800 text-sm font-medium px-3 py-1 rounded-full">
                  Admin
                </span>
              )}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">Member Since</label>
            <p className="text-white">
              {new Date(profile.created_at).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">Last Updated</label>
            <p className="text-white">
              {new Date(profile.updated_at).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </p>
          </div>
        </div>
      </div>

      {/* Profile Information */}
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <h2 className="text-xl font-bold text-white mb-4">Profile Information</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-900 border border-red-700 text-red-200 px-4 py-3 rounded">
              {error}
            </div>
          )}
          
          {success && (
            <div className="bg-green-900 border border-green-700 text-green-200 px-4 py-3 rounded">
              {success}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="fullName" className="block text-sm font-medium text-gray-200 mb-1">
                Full Name
              </label>
              <input
                id="fullName"
                name="fullName"
                type="text"
                value={formData.fullName}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label htmlFor="apartmentNumber" className="block text-sm font-medium text-gray-200 mb-1">
                Apartment Number
              </label>
              <input
                id="apartmentNumber"
                name="apartmentNumber"
                type="text"
                value={formData.apartmentNumber}
                readOnly
                className="w-full px-3 py-2 bg-gray-600 border border-gray-600 text-gray-300 rounded-md cursor-not-allowed"
                title="Contact an administrator to change your apartment number"
              />
              <p className="text-xs text-gray-400 mt-1">
                Contact an admin to change your apartment number
              </p>
            </div>

            <div className="md:col-span-2">
              <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-200 mb-1">
                Phone Number (Optional)
              </label>
              <input
                id="phoneNumber"
                name="phoneNumber"
                type="tel"
                value={formData.phoneNumber}
                onChange={handleInputChange}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder-gray-400"
                placeholder="Enter your phone number"
              />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-2 rounded-md font-medium transition-colors"
            >
              {loading ? 'Updating...' : 'Update Profile'}
            </button>
          </div>
        </form>
      </div>

      {/* Security Settings */}
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <h2 className="text-xl font-bold text-white mb-4">Security Settings</h2>
        
        <div className="space-y-4">
          <div className="flex justify-between items-center p-4 bg-gray-700 rounded-lg">
            <div>
              <h3 className="text-white font-medium">Password</h3>
              <p className="text-gray-400 text-sm">Change your account password</p>
            </div>
            <button
              onClick={handlePasswordReset}
              className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
            >
              Reset Password
            </button>
          </div>

          <div className="flex justify-between items-center p-4 bg-gray-700 rounded-lg">
            <div>
              <h3 className="text-white font-medium">Email Verification</h3>
              <p className="text-gray-400 text-sm">
                {user.email_confirmed_at ? 'Your email is verified' : 'Email not verified'}
              </p>
            </div>
            {user.email_confirmed_at ? (
              <span className="bg-green-100 text-green-800 text-sm font-medium px-3 py-1 rounded-full">
                Verified
              </span>
            ) : (
              <span className="bg-yellow-100 text-yellow-800 text-sm font-medium px-3 py-1 rounded-full">
                Unverified
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Account Actions */}
      {!profile.is_approved && (
        <div className="bg-yellow-900 bg-opacity-50 border border-yellow-700 rounded-lg p-4">
          <h3 className="text-yellow-200 font-medium mb-2">Account Pending Approval</h3>
          <p className="text-yellow-300 text-sm">
            Your account is currently pending approval from a building administrator. 
            You&apos;ll be able to access all features once your account is approved and your parking spots are verified.
          </p>
        </div>
      )}
    </div>
  )
}