import { createClient } from '@supabase/supabase-js'
import { Database } from '@/types/database'

let supabaseInstance: ReturnType<typeof createClient<Database>> | null = null
let clientId = 0

export function getSupabaseClient() {
  if (!supabaseInstance) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    
    if (!url || !key) {
      throw new Error(`Missing Supabase environment variables: url=${!!url}, key=${!!key}`)
    }
    
    clientId++
    supabaseInstance = createClient<Database>(url, key)
  }
  
  return supabaseInstance
}

// For debugging - track client creation
export function getClientId() {
  return clientId
}