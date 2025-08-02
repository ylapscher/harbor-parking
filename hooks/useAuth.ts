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

  let supabase: ReturnType<typeof getSupabaseClient>
  try {
    supabase = getSupabaseClient()
  } catch (error) {
    console.error('Failed to create Supabase client:', error)
    // Return a non-loading state immediately if client creation fails
    return {
      user: null,
      profile: null,
      loading: false,
      signOut: async () => {},
      refreshProfile: async () => {},
      isAdmin: false,
      isApproved: false,
    }
  }

  useEffect(() => {
    let mounted = true
    
    console.log('useAuth: Starting initialization')
    console.log('useAuth: Environment check', {
      hasUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      hasKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    })
    
    // Get initial session with timeout
    const getInitialSession = async () => {
      try {
        // Check environment variables first
        if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
          console.error('Missing Supabase environment variables')
          if (mounted) setAuthState({ user: null, profile: null, loading: false })
          return
        }

        console.log('useAuth: Fetching session...')
        
        // Try to get session with a more aggressive timeout
        let session = null
        let sessionError = null
        
        try {
          const result = await Promise.race([
            supabase.auth.getSession(),
            new Promise((_, reject) => 
              setTimeout(() => reject(new Error('Session fetch timeout')), 3000)
            )
          ])
          session = (result as any)?.data?.session
          sessionError = (result as any)?.error
        } catch (timeoutErr) {
          console.warn('Session fetch timed out, continuing without session')
          if (mounted) {
            setAuthState({ user: null, profile: null, loading: false })
          }
          return
        }
        
        console.log('useAuth: Session result', { hasSession: !!session, error: sessionError })
        
        if (sessionError) {
          console.error('Session error:', sessionError)
          if (mounted) setAuthState({ user: null, profile: null, loading: false })
          return
        }
        
        if (session?.user) {
          try {
            // Fetch user profile with timeout
            const profilePromise = supabase
              .from('profiles')
              .select('*')
              .eq('id', session.user.id)
              .single()
            
            const profileTimeoutPromise = new Promise((_, reject) =>
              setTimeout(() => reject(new Error('Profile fetch timeout')), 5000)
            )

            const profileResult = await Promise.race([
              profilePromise,
              profileTimeoutPromise
            ])
            const { data: profile, error: profileError } = profileResult as { data: Profile | null, error: { code?: string, message?: string } | null }

            if (profileError) {
              console.error('Profile error:', profileError)
              
              // If profiles table doesn't exist or RLS blocks access, just use user without profile
              if (profileError.code === '42P01' || profileError.code === '42501' || profileError.code === 'PGRST301') {
                console.log('Profile access blocked, continuing with user only')
                if (mounted) setAuthState({
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
                    if (mounted) setAuthState({
                      user: session.user,
                      profile: null,
                      loading: false,
                    })
                  } else {
                    if (mounted) setAuthState({
                      user: session.user,
                      profile: newProfile,
                      loading: false,
                    })
                  }
                } catch (err) {
                  if (mounted) setAuthState({
                    user: session.user,
                    profile: null,
                    loading: false,
                  })
                }
              } else {
                // Other profile errors - just continue without profile
                if (mounted) setAuthState({
                  user: session.user,
                  profile: null,
                  loading: false,
                })
              }
            } else {
              if (mounted) setAuthState({
                user: session.user,
                profile,
                loading: false,
              })
            }
          } catch (err) {
            if (mounted) setAuthState({
              user: session.user,
              profile: null,
              loading: false,
            })
          }
        } else {
          console.log('useAuth: No session found, setting to unauthenticated')
          if (mounted) setAuthState({
            user: null,
            profile: null,
            loading: false,
          })
        }
      } catch (err) {
        console.error('Auth initialization error:', err)
        // If it's a timeout or connection error, assume no session and continue
        if (mounted) {
          setAuthState({
            user: null,
            profile: null,
            loading: false,
          })
        }
      }
    }

    // Fallback timeout to ensure loading never gets stuck
    const fallbackTimeout = setTimeout(() => {
      if (mounted) {
        console.warn('Auth loading timeout, forcing non-loading state - user should be able to use the app')
        setAuthState({
          user: null,
          profile: null,
          loading: false,
        })
      }
    }, 4000)

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
                if (mounted) setAuthState({
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

                  if (mounted) setAuthState({
                    user: session.user,
                    profile: newProfile,
                    loading: false,
                  })
                } catch (err) {
                  if (mounted) setAuthState({
                    user: session.user,
                    profile: null,
                    loading: false,
                  })
                }
              } else {
                if (mounted) setAuthState({
                  user: session.user,
                  profile,
                  loading: false,
                })
              }
            } catch (err) {
              if (mounted) setAuthState({
                user: session.user,
                profile: null,
                loading: false,
              })
            }
          } else {
            if (mounted) setAuthState({
              user: null,
              profile: null,
              loading: false,
            })
          }
        } catch (err) {
          if (mounted) setAuthState({
            user: null,
            profile: null,
            loading: false,
          })
        }
      }
    )

    return () => {
      mounted = false
      clearTimeout(fallbackTimeout)
      subscription.unsubscribe()
    }
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