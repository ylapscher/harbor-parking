'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { User } from '@supabase/supabase-js'
import { Profile } from '@/types'
import { createSupabaseBrowserClient } from '@/lib/supabase/client'

interface AuthContextType {
  user: User | null
  profile: Profile | null
  loading: boolean
  isAdmin: boolean
  isApproved: boolean
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | null>(null)

interface AuthProviderProps {
  children: React.ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createSupabaseBrowserClient()

  const refreshProfile = async () => {
    if (!user) return

    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    setProfile(profile)
  }

  useEffect(() => {
    const getInitialSession = async () => {
      const {data} = await supabase.auth.getUser();
     
      if (!data?.user) {
        console.warn("Getting Initial Session: No user found")
        setLoading(false)
        return
      }

      setUser(data.user)

      const {data: profile} = await supabase.from('profiles').select('*').eq('id', data?.user.id).single()
      
      if (!profile) {
        console.warn("Getting Initial Session: No profile found")
        setLoading(false)
        return
      }
      
      setProfile(profile)
      setLoading(false)
    }
    
    getInitialSession()
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null)
    })  
    
    return () => subscription.unsubscribe()
  }, [])



  const value: AuthContextType = {
    user,
    profile,
    loading,
    isAdmin: profile?.is_admin || false,
    isApproved: profile?.is_approved || false,
    refreshProfile
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuthContext must be used within an AuthProvider')
  }
  return context
}
