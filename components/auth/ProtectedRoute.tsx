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
    if (loading) return

    // Check authentication requirement
    if (requireAuth && !user) {
      router.push(fallbackUrl)
      return
    }

    // Check approval requirement
    if (requireApproval && (!profile || !profile.is_approved)) {
      router.push('/pending-approval')
      return
    }

    // Check admin requirement
    if ((requireAdmin || adminOnly) && (!profile || !profile.is_admin)) {
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

  // Don't render if auth requirements not met
  if (requireAuth && !user) return null
  if (requireApproval && (!profile || !profile.is_approved)) return null
  if ((requireAdmin || adminOnly) && (!profile || !profile.is_admin)) return null

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