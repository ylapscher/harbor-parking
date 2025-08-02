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
    const supabase = getSupabaseClient()

    try {
      await supabase.auth.signOut()
      router.push('/')
      router.refresh()
    } catch (error) {
      // Handle error silently
    } finally {
      setLoading(false)
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