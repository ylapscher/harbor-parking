import { createClient } from '@supabase/supabase-js'
import { Database } from '@/types/database'

let supabaseInstance: ReturnType<typeof createClient<Database>> | null = null
let supabaseAdminInstance: ReturnType<typeof createClient<Database>> | null = null
let clientId = 0

export function getSupabaseClient() {
  if (!supabaseInstance) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
    
    console.log('Creating Supabase client with:', { 
      hasUrl: !!url, 
      hasKey: !!publishableKey, 
      urlLength: url?.length,
      keyPrefix: publishableKey?.substring(0, 15) 
    })
    
    if (!url) {
      throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL environment variable')
    }
    
    if (!publishableKey) {
      throw new Error('Missing NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY environment variable')
    }
    
    clientId++
    console.log('Supabase client created, ID:', clientId)
    supabaseInstance = createClient<Database>(url, publishableKey, {
      auth: {
        persistSession: true,
        detectSessionInUrl: true,
        autoRefreshToken: true,
        storageKey: 'harbor-auth',
      },
      realtime: {
        params: {
          eventsPerSecond: 2
        }
      },
      global: {
        fetch: (url, options = {}) => {
          const controller = new AbortController()
          const timeout = setTimeout(() => controller.abort(), 5000) // 5 second timeout
          
          return fetch(url, {
            ...options,
            signal: controller.signal
          }).finally(() => clearTimeout(timeout))
        }
      }
    })
  }
  
  return supabaseInstance
}

// For debugging - track client creation
export function getClientId() {
  return clientId
}

export function getSupabaseAdmin() {
  if (!supabaseAdminInstance) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
    const secretKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!url) {
      throw new Error('Missing SUPABASE_URL environment variable')
    }

    if (!secretKey) {
      throw new Error('Missing SUPABASE_SECRET_KEY or SUPABASE_SERVICE_ROLE_KEY environment variable')
    }

    supabaseAdminInstance = createClient<Database>(url, secretKey)
  }

  return supabaseAdminInstance
}
