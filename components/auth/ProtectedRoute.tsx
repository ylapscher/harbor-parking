'use client'

import { useAuth } from '@/hooks/useAuth'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

interface ProtectedRouteProps {
  children: React.ReactNode
  requireAuth?: boolean
  requireApproval?: boolean
  requireAdmin?: boolean
  adminOnly?: boolean
  fallbackUrl?: string
}

export function ProtectedRoute({
  children,
  requireAuth = true,
  requireApproval = false,
  requireAdmin = false,
  adminOnly = false,
  fallbackUrl = '/',
}: ProtectedRouteProps) {
  const { user, profile, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    const DEBUG = process.env.NEXT_PUBLIC_DEBUG === 'true'
    const log = DEBUG ? console.log : () => {}
    const logGroup = DEBUG ? console.group : () => {}
    
    if (loading) {
      log('🔒 ProtectedRoute: Still loading, waiting...')
      return
    }

    // Check for recent login success in localStorage as fallback
    const recentLogin = localStorage.getItem('harbor-login-success')
    const userEmail = localStorage.getItem('harbor-user-email')
    const isRecentLogin = recentLogin && (Date.now() - parseInt(recentLogin)) < 300000 // 5 minutes
    
    logGroup('🔒 ProtectedRoute evaluation')
    log('Route requirements:', {
      requireAuth,
      requireApproval,
      requireAdmin,
      adminOnly,
      fallbackUrl
    })
    log('Current state:', { 
      user: !!user, 
      profile: !!profile, 
      loading, 
      isRecentLogin,
      userEmail,
      isApproved: profile?.is_approved,
      isAdmin: profile?.is_admin,
      timestamp: new Date().toISOString()
    })

    // If we have a recent login but no user (Supabase timeout), allow access
    if (requireAuth && !user && !isRecentLogin) {
      console.log('No auth and no recent login, redirecting to:', fallbackUrl)
      router.push(fallbackUrl)
      return
    }

    // For approval and admin checks, be more lenient if Supabase is unreachable
    if (requireApproval && profile && !profile.is_approved) {
      router.push('/pending-approval')
      return
    }

    if ((requireAdmin || adminOnly) && profile && !profile.is_admin) {
      router.push('/dashboard')
      return
    }
  }, [user, profile, loading, requireAuth, requireApproval, requireAdmin, adminOnly, fallbackUrl, router])

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  // Check for recent login as fallback
  const recentLogin = typeof window !== 'undefined' ? localStorage.getItem('harbor-login-success') : null
  const isRecentLogin = recentLogin && (Date.now() - parseInt(recentLogin)) < 300000 // 5 minutes

  // Don't render if auth requirements not met (but allow recent login)
  if (requireAuth && !user && !isRecentLogin) return null
  if (requireApproval && profile && !profile.is_approved) return null
  if ((requireAdmin || adminOnly) && profile && !profile.is_admin) return null

  return <>{children}</>
}

// Convenience wrapper for approved user routes
export function ApprovedRoute({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute requireAuth requireApproval fallbackUrl="/login">
      {children}
    </ProtectedRoute>
  )
}

// Convenience wrapper for admin routes
export function AdminRoute({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute requireAuth requireApproval requireAdmin fallbackUrl="/dashboard">
      {children}
    </ProtectedRoute>
  )
}