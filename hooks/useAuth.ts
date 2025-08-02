'use client'

import { useEffect, useState } from 'react'
import { User } from '@supabase/supabase-js'
import { getSupabaseClient } from '@/lib/supabase/singleton'
import { Profile } from '@/types'

interface AuthState {
  user: User | null
  profile: Profile | null
  loading: boolean
}

export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    profile: null,
    loading: true,
  })

  const supabase = getSupabaseClient()

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()
        
        if (sessionError) {
          setAuthState({ user: null, profile: null, loading: false })
          return
        }
        
        if (session?.user) {
          try {
            // Fetch user profile
            const { data: profile, error: profileError } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', session.user.id)
              .single()

            if (profileError) {
              
              // If profiles table doesn't exist or RLS blocks access, just use user without profile
              if (profileError.code === '42P01' || profileError.code === '42501' || profileError.code === 'PGRST301') {
                setAuthState({
                  user: session.user,
                  profile: null,
                  loading: false,
                })
                return
              }
              
              // If no profile exists (not found), try to create one
              if (profileError.code === 'PGRST116') {
                try {
                  const { data: newProfile, error: createError } = await supabase
                    .from('profiles')
                    .insert({
                      id: session.user.id,
                      email: session.user.email || '',
                      full_name: session.user.user_metadata?.full_name || '',
                      apartment_number: session.user.user_metadata?.apartment_number || '',
                      phone_number: session.user.user_metadata?.phone_number || null,
                      is_approved: false,
                      is_admin: false
                    })
                    .select()
                    .single()

                  if (createError) {
                    setAuthState({
                      user: session.user,
                      profile: null,
                      loading: false,
                    })
                  } else {
                    setAuthState({
                      user: session.user,
                      profile: newProfile,
                      loading: false,
                    })
                  }
                } catch (err) {
                  setAuthState({
                    user: session.user,
                    profile: null,
                    loading: false,
                  })
                }
              } else {
                // Other profile errors - just continue without profile
                setAuthState({
                  user: session.user,
                  profile: null,
                  loading: false,
                })
              }
            } else {
              setAuthState({
                user: session.user,
                profile,
                loading: false,
              })
            }
          } catch (err) {
            setAuthState({
              user: session.user,
              profile: null,
              loading: false,
            })
          }
        } else {
          setAuthState({
            user: null,
            profile: null,
            loading: false,
          })
        }
      } catch (err) {
        setAuthState({
          user: null,
          profile: null,
          loading: false,
        })
      }
    }

    getInitialSession()

    // Listen for auth changes with error handling
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        try {
          if (session?.user) {
            // Only try to fetch profile if we haven't already determined it's not available
            try {
              const { data: profile, error: profileError } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', session.user.id)
                .single()

              if (profileError && profileError.code !== 'PGRST116') {
                setAuthState({
                  user: session.user,
                  profile: null,
                  loading: false,
                })
                return
              }

              // If no profile exists, try to create one
              if (!profile && profileError?.code === 'PGRST116') {
                try {
                  const { data: newProfile } = await supabase
                    .from('profiles')
                    .insert({
                      id: session.user.id,
                      email: session.user.email || '',
                      full_name: session.user.user_metadata?.full_name || '',
                      apartment_number: session.user.user_metadata?.apartment_number || '',
                      phone_number: session.user.user_metadata?.phone_number || null,
                      is_approved: false,
                      is_admin: false
                    })
                    .select()
                    .single()

                  setAuthState({
                    user: session.user,
                    profile: newProfile,
                    loading: false,
                  })
                } catch (err) {
                  setAuthState({
                    user: session.user,
                    profile: null,
                    loading: false,
                  })
                }
              } else {
                setAuthState({
                  user: session.user,
                  profile,
                  loading: false,
                })
              }
            } catch (err) {
              setAuthState({
                user: session.user,
                profile: null,
                loading: false,
              })
            }
          } else {
            setAuthState({
              user: null,
              profile: null,
              loading: false,
            })
          }
        } catch (err) {
          setAuthState({
            user: null,
            profile: null,
            loading: false,
          })
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const signOut = async () => {
    await supabase.auth.signOut()
  }

  const refreshProfile = async () => {
    if (!authState.user) return

    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authState.user.id)
        .single()

      setAuthState(prev => ({
        ...prev,
        profile
      }))
    } catch (err) {
      // Handle error silently
    }
  }

  return {
    ...authState,
    signOut,
    refreshProfile,
    isAdmin: authState.profile?.is_admin || false,
    isApproved: authState.profile?.is_approved || false,
  }
}