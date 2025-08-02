'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { getSupabaseClient } from '@/lib/supabase/singleton'

interface LogoutButtonProps {
  className?: string
  children?: React.ReactNode
}

export function LogoutButton({ className = '', children }: LogoutButtonProps) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleLogout = async () => {
    setLoading(true)
    
    // Clear localStorage immediately
    localStorage.removeItem('harbor-login-success')
    localStorage.removeItem('harbor-user-email')
    
    const supabase = getSupabaseClient()

    try {
      await supabase.auth.signOut()
    } catch {
      // Handle error silently
    } finally {
      setLoading(false)
      router.push('/')
      router.refresh()
    }
  }

  return (
    <button
      onClick={handleLogout}
      disabled={loading}
      className={`${className} disabled:opacity-50 disabled:cursor-not-allowed`}
    >
      {loading ? 'Signing out...' : (children || 'Sign Out')}
    </button>
  )
}