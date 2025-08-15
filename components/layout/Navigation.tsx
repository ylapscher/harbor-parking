'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { LogoutButton } from '@/components/auth/LogoutButton'
import { useAuth } from '../providers/AuthProvider'

export function Navigation() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const { user, profile, loading } = useAuth()!
  const router = useRouter()

  if (loading) {
    return (
      <nav className="bg-gray-800 border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <div className="animate-pulse bg-gray-700 h-8 w-32 rounded"></div>
            </div>
          </div>
        </div>
      </nav>
    )
  }

  // Check for recent login as fallback
  const recentLogin = typeof window !== 'undefined' ? localStorage.getItem('harbor-login-success') : null
  const userEmail = typeof window !== 'undefined' ? localStorage.getItem('harbor-user-email') : null
  const isRecentLogin = recentLogin && (Date.now() - parseInt(recentLogin)) < 300000 // 5 minutes

  if (!user && !isRecentLogin) return null

  return (
    <nav className="bg-gray-800 border-b border-gray-700 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo and main nav */}
          <div className="flex items-center">
            <button
              onClick={() => router.push('/dashboard')}
              className="text-white text-xl font-bold hover:text-gray-300 transition-colors"
            >
              Harbor Parking
            </button>
            
            {/* Desktop navigation */}
            <div className="hidden md:ml-10 md:flex md:space-x-8">
              <button
                onClick={() => router.push('/dashboard')}
                className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors"
              >
                Dashboard
              </button>
              {profile?.is_admin && (
                <button
                  onClick={() => router.push('/admin')}
                  className="text-yellow-400 hover:text-yellow-300 px-3 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  Admin
                </button>
              )}
            </div>
          </div>

          {/* User menu */}
          <div className="flex items-center">
            {/* User status badge */}
            <div className="hidden sm:flex sm:items-center sm:mr-4">
              {profile?.is_approved ? (
                <span className="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                  Approved
                </span>
              ) : (
                <span className="bg-yellow-100 text-yellow-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                  Pending
                </span>
              )}
            </div>

            {/* Desktop user menu */}
            <div className="hidden md:flex md:items-center md:space-x-4">
              <button
                onClick={() => router.push('/profile')}
                className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors"
              >
                {profile?.full_name || user?.email || userEmail || 'User'}
              </button>
              <LogoutButton className="bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-md text-sm font-medium transition-colors">
                Sign Out
              </LogoutButton>
            </div>

            {/* Mobile menu button */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden inline-flex items-center justify-center p-2 rounded-md text-gray-300 hover:text-white hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
            >
              <span className="sr-only">Open main menu</span>
              {!isMenuOpen ? (
                <svg className="block h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              ) : (
                <svg className="block h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {isMenuOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 border-t border-gray-700">
              <button
                onClick={() => {
                  router.push('/dashboard')
                  setIsMenuOpen(false)
                }}
                className="text-gray-300 hover:text-white block px-3 py-2 rounded-md text-base font-medium w-full text-left transition-colors"
              >
                Dashboard
              </button>
              {profile?.is_admin && (
                <button
                  onClick={() => {
                    router.push('/admin')
                    setIsMenuOpen(false)
                  }}
                  className="text-yellow-400 hover:text-yellow-300 block px-3 py-2 rounded-md text-base font-medium w-full text-left transition-colors"
                >
                  Admin
                </button>
              )}
              <div className="border-t border-gray-700 pt-4">
                <div className="flex items-center px-3 mb-3">
                  <div className="text-sm text-gray-300">
                    {profile?.full_name || user?.email || userEmail || 'User'}
                  </div>
                  <div className="ml-auto">
                    {profile?.is_approved ? (
                      <span className="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                        Approved
                      </span>
                    ) : (
                      <span className="bg-yellow-100 text-yellow-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                        Pending
                      </span>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => {
                    router.push('/profile')
                    setIsMenuOpen(false)
                  }}
                  className="text-gray-300 hover:text-white block px-3 py-2 rounded-md text-base font-medium w-full text-left transition-colors"
                >
                  Profile Settings
                </button>
                <div className="px-3 py-2">
                  <LogoutButton className="bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-md text-sm font-medium transition-colors w-full">
                    Sign Out
                  </LogoutButton>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}