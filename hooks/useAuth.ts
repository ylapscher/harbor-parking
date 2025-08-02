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
  // Check for development bypass immediately
  const isDev = process.env.NODE_ENV === 'development'
  const hasRecentLogin = typeof window !== 'undefined' && localStorage.getItem('harbor-login-success')
  const userEmail = typeof window !== 'undefined' ? localStorage.getItem('harbor-user-email') : null
  
  const [authState, setAuthState] = useState<AuthState>({
    user: isDev && hasRecentLogin ? {
      id: 'dev-user-id',
      email: userEmail || 'dev@example.com',
      app_metadata: {},
      user_metadata: {
        full_name: 'Dev User',
        apartment_number: '101',
      },
      aud: 'authenticated',
      created_at: new Date().toISOString(),
    } as any : null,
    profile: isDev && hasRecentLogin ? {
      id: 'dev-user-id',
      email: userEmail || 'dev@example.com',
      full_name: 'Dev User',
      apartment_number: '101',
      phone_number: null,
      is_approved: true,
      is_admin: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    } as Profile : null,
    loading: !(isDev && hasRecentLogin),
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
    const effectId = Math.random().toString(36).substr(2, 9)
    
    const DEBUG = process.env.NEXT_PUBLIC_DEBUG === 'true'
    const log = DEBUG ? console.log : () => {}
    const logGroup = DEBUG ? console.group : () => {}
    const logGroupEnd = DEBUG ? console.groupEnd : () => {}
    
    // Check for dev mode bypass
    const DEV_BYPASS = process.env.NEXT_PUBLIC_DEV_BYPASS === 'true' && typeof window !== 'undefined' && window.location.hostname === 'localhost'
    
    // Create unique timer names to avoid conflicts
    const sessionTimerName = `getSession-${effectId}`
    const profileTimerName = `profileFetch-${effectId}`
    
    const logTime = DEBUG ? (name: string) => console.time(name) : () => {}
    const logTimeEnd = DEBUG ? (name: string) => {
      try {
        console.timeEnd(name)
      } catch (e) {
        // Timer doesn't exist, ignore
      }
    } : () => {}
    
    logGroup(`🔑 useAuth: Starting initialization [${effectId}]`)
log('useAuth: Environment check', {
      hasUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      hasKey: !!process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
      debug: DEBUG,
      devBypass: DEV_BYPASS,
      effectId,
      timestamp: new Date().toISOString()
    })
    
    // In development with recent login, use mock data
    if (DEV_BYPASS && localStorage.getItem('harbor-login-success')) {
      const email = localStorage.getItem('harbor-user-email') || 'dev@example.com'
      log('🚀 Dev bypass active - using mock user')
      
      const devTimeout = setTimeout(() => {
        if (mounted) {
          setAuthState({
            user: {
              id: 'dev-user-id',
              email,
              app_metadata: {},
              user_metadata: {
                full_name: 'Dev User',
                apartment_number: '101',
              },
              aud: 'authenticated',
              created_at: new Date().toISOString(),
            } as any,
            profile: {
              id: 'dev-user-id',
              email,
              full_name: 'Dev User',
              apartment_number: '101',
              phone_number: null,
              is_approved: true,
              is_admin: true,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            } as Profile,
            loading: false,
          })
        }
      }, 100)
      
      logGroupEnd()
      
      // Return cleanup function for dev bypass
      return () => {
        mounted = false
        clearTimeout(devTimeout)
      }
    }
    
    // Get initial session with timeout
    const getInitialSession = async () => {
      try {
        // Check environment variables first
if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) {
          console.error('Missing Supabase environment variables')
          if (mounted) setAuthState({ user: null, profile: null, loading: false })
          return
        }

        logTime(sessionTimerName)
        log('useAuth: Fetching session...')
        
        // Try to get session with a more aggressive timeout
        let session = null
        let sessionError = null
        
        try {
          const sessionStartTime = performance.now()
          const result = await Promise.race([
            supabase.auth.getSession(),
            new Promise((_, reject) => 
setTimeout(() => reject(new Error('Session fetch timeout')), 3000)
            )
          ])
          const sessionEndTime = performance.now()
          
          session = (result as any)?.data?.session
          sessionError = (result as any)?.error
          
          logTimeEnd(sessionTimerName)
          log('📊 Session timing:', {
            duration: `${(sessionEndTime - sessionStartTime).toFixed(2)}ms`,
            hasSession: !!session,
            hasUser: !!session?.user,
            sessionId: session?.user?.id?.substring(0, 8) + '...',
            error: sessionError
          })
        } catch (timeoutErr) {
          logTimeEnd(sessionTimerName)
          console.warn('⚠️ Session fetch timed out, continuing without session', timeoutErr)
          if (mounted) {
            setAuthState({ user: null, profile: null, loading: false })
          }
          logGroupEnd()
          return
        }
        
        if (sessionError) {
          console.error('Session error:', sessionError)
          if (mounted) setAuthState({ user: null, profile: null, loading: false })
          return
        }
        
        if (session?.user) {
          logGroup('👤 Fetching user profile')
          logTime(profileTimerName)
          log('Profile fetch for user:', session.user.id.substring(0, 8) + '...')
          
          try {
            const profileStartTime = performance.now()
            
            // Fetch user profile with timeout
            const profilePromise = supabase
              .from('profiles')
              .select('*')
              .eq('id', session.user.id)
              .single()
            
            const profileTimeoutPromise = new Promise((_, reject) =>
              setTimeout(() => reject(new Error('Profile fetch timeout')), 2000)
            )

            const profileResult = await Promise.race([
              profilePromise,
              profileTimeoutPromise
            ])
            
            const profileEndTime = performance.now()
            logTimeEnd(profileTimerName)
            
            const { data: profile, error: profileError } = profileResult as { data: Profile | null, error: { code?: string, message?: string } | null }
            
            log('📊 Profile fetch timing:', {
              duration: `${(profileEndTime - profileStartTime).toFixed(2)}ms`,
              hasProfile: !!profile,
              error: profileError,
              profileId: profile?.id?.substring(0, 8) + '...',
              isApproved: profile?.is_approved,
              isAdmin: profile?.is_admin
            })

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
      if (mounted && authState.loading) {
        console.warn('Auth loading timeout, forcing non-loading state - user should be able to use the app')
        setAuthState({
          user: null,
          profile: null,
          loading: false,
        })
      }
    }, 5000)

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