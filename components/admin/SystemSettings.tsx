'use client'

import { useState } from 'react'
import { getSupabaseClient } from '@/lib/supabase/singleton'

interface SystemSettingsProps {
  onRefresh: () => void
}

export function SystemSettings({ onRefresh }: SystemSettingsProps) {
  const [settings, setSettings] = useState({
    autoApproveUsers: false,
    requireSpotVerification: true,
    maxSpotsPerUser: 3,
    maxClaimsPerUser: 5,
    allowGuestClaims: false,
    notificationEmails: true,
    maintenanceMode: false,
  })
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  const supabase = getSupabaseClient()

  const handleSettingChange = (key: keyof typeof settings, value: boolean | number) => {
    setSettings(prev => ({ ...prev, [key]: value }))
  }

  const handleSaveSettings = async () => {
    setLoading(true)
    setMessage(null)

    try {
      // In a real app, you'd save these to a settings table
      // For now, we'll just simulate the save
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      setMessage({ type: 'success', text: 'Settings saved successfully!' })
      onRefresh()
    } catch (error) {
      console.error('Failed to save settings:', error)
      setMessage({ type: 'error', text: 'Failed to save settings. Please try again.' })
    } finally {
      setLoading(false)
    }
  }

  const handleBulkUserAction = async (action: 'approve_all' | 'reset_all_claims') => {
    setLoading(true)
    setMessage(null)

    try {
      if (action === 'approve_all') {
        const { error } = await supabase
          .from('profiles')
          .update({ 
            is_approved: true,
            updated_at: new Date().toISOString()
          })
          .eq('is_approved', false)

        if (error) throw error
        setMessage({ type: 'success', text: 'All pending users have been approved!' })
      } else if (action === 'reset_all_claims') {
        const { error } = await supabase
          .from('claims')
          .update({ 
            status: 'cancelled',
            updated_at: new Date().toISOString()
          })
          .in('status', ['pending', 'confirmed'])

        if (error) throw error
        setMessage({ type: 'success', text: 'All active claims have been reset!' })
      }

      onRefresh()
    } catch (error) {
      console.error(`Failed to ${action}:`, error)
      setMessage({ type: 'error', text: `Failed to ${action.replace('_', ' ')}. Please try again.` })
    } finally {
      setLoading(false)
    }
  }

  const handleDatabaseMaintenance = async (action: 'cleanup_expired' | 'reset_verifications') => {
    setLoading(true)
    setMessage(null)

    try {
      if (action === 'cleanup_expired') {
        // Clean up expired availabilities
        const { error: availError } = await supabase
          .from('availabilities')
          .update({ is_active: false })
          .lt('end_time', new Date().toISOString())

        if (availError) throw availError

        // Clean up expired claims
        const { error: claimError } = await supabase
          .from('claims')
          .update({ status: 'expired' })
          .eq('status', 'confirmed')
          .lt('availabilities.end_time', new Date().toISOString())

        if (claimError) throw claimError

        setMessage({ type: 'success', text: 'Expired records cleaned up successfully!' })
      } else if (action === 'reset_verifications') {
        const { error } = await supabase
          .from('parking_spots')
          .update({ 
            is_verified: false,
            updated_at: new Date().toISOString()
          })
          .eq('is_verified', true)

        if (error) throw error
        setMessage({ type: 'success', text: 'All spot verifications have been reset!' })
      }

      onRefresh()
    } catch (error) {
      console.error(`Failed to ${action}:`, error)
      setMessage({ type: 'error', text: `Failed to ${action.replace('_', ' ')}. Please try again.` })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <h2 className="text-xl font-bold text-white mb-6">System Settings</h2>

        {message && (
          <div className={`mb-6 p-4 rounded-lg border ${
            message.type === 'success'
              ? 'bg-green-900 border-green-700 text-green-200'
              : 'bg-red-900 border-red-700 text-red-200'
          }`}>
            {message.text}
          </div>
        )}

        <div className="space-y-6">
          {/* User Management Settings */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-4">User Management</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-white font-medium">Auto-approve new users</label>
                  <p className="text-sm text-gray-400">Automatically approve user registrations without admin review</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.autoApproveUsers}
                    onChange={(e) => handleSettingChange('autoApproveUsers', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <label className="text-white font-medium">Max spots per user</label>
                  <p className="text-sm text-gray-400">Maximum number of parking spots a user can register</p>
                </div>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={settings.maxSpotsPerUser}
                  onChange={(e) => handleSettingChange('maxSpotsPerUser', parseInt(e.target.value))}
                  className="w-20 px-3 py-2 bg-gray-700 border border-gray-600 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <label className="text-white font-medium">Max claims per user</label>
                  <p className="text-sm text-gray-400">Maximum number of active claims a user can have</p>
                </div>
                <input
                  type="number"
                  min="1"
                  max="20"
                  value={settings.maxClaimsPerUser}
                  onChange={(e) => handleSettingChange('maxClaimsPerUser', parseInt(e.target.value))}
                  className="w-20 px-3 py-2 bg-gray-700 border border-gray-600 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Spot Management Settings */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-4">Spot Management</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-white font-medium">Require spot verification</label>
                  <p className="text-sm text-gray-400">Admin must verify parking spots before they can be shared</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.requireSpotVerification}
                    onChange={(e) => handleSettingChange('requireSpotVerification', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <label className="text-white font-medium">Allow guest claims</label>
                  <p className="text-sm text-gray-400">Allow unapproved users to claim spots</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.allowGuestClaims}
                    onChange={(e) => handleSettingChange('allowGuestClaims', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
            </div>
          </div>

          {/* System Settings */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-4">System</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-white font-medium">Email notifications</label>
                  <p className="text-sm text-gray-400">Send email notifications for claims and updates</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.notificationEmails}
                    onChange={(e) => handleSettingChange('notificationEmails', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <label className="text-white font-medium">Maintenance mode</label>
                  <p className="text-sm text-gray-400">Disable system for maintenance (admin access only)</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.maintenanceMode}
                    onChange={(e) => handleSettingChange('maintenanceMode', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
            </div>
          </div>

          {/* Save Button */}
          <div className="pt-4 border-t border-gray-700">
            <button
              onClick={handleSaveSettings}
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-6 py-2 rounded-md font-medium transition-colors"
            >
              {loading ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        </div>
      </div>

      {/* Bulk Actions */}
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <h3 className="text-lg font-semibold text-white mb-4">Bulk Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button
            onClick={() => handleBulkUserAction('approve_all')}
            disabled={loading}
            className="bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white p-4 rounded-lg text-left transition-colors"
          >
            <h4 className="font-medium mb-1">Approve All Pending Users</h4>
            <p className="text-sm text-green-200">Approve all users waiting for admin review</p>
          </button>

          <button
            onClick={() => handleBulkUserAction('reset_all_claims')}
            disabled={loading}
            className="bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white p-4 rounded-lg text-left transition-colors"
          >
            <h4 className="font-medium mb-1">Reset All Claims</h4>
            <p className="text-sm text-red-200">Cancel all active claims (emergency use only)</p>
          </button>
        </div>
      </div>

      {/* Database Maintenance */}
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <h3 className="text-lg font-semibold text-white mb-4">Database Maintenance</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button
            onClick={() => handleDatabaseMaintenance('cleanup_expired')}
            disabled={loading}
            className="bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white p-4 rounded-lg text-left transition-colors"
          >
            <h4 className="font-medium mb-1">Clean Up Expired Records</h4>
            <p className="text-sm text-purple-200">Remove old availabilities and expired claims</p>
          </button>

          <button
            onClick={() => handleDatabaseMaintenance('reset_verifications')}
            disabled={loading}
            className="bg-yellow-600 hover:bg-yellow-700 disabled:opacity-50 text-white p-4 rounded-lg text-left transition-colors"
          >
            <h4 className="font-medium mb-1">Reset Spot Verifications</h4>
            <p className="text-sm text-yellow-200">Unverify all parking spots for re-review</p>
          </button>
        </div>
      </div>
    </div>
  )
}