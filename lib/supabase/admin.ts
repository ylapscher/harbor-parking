import { createClient } from '@supabase/supabase-js'
import { Database } from '@/types/database'

let adminClient: ReturnType<typeof createClient<Database>> | null = null

export function getSupabaseAdmin() {
  if (!adminClient) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
    const secretKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY
    
    if (!url) {
      throw new Error('Missing SUPABASE_URL environment variable')
    }
    
    if (!secretKey) {
      throw new Error('Missing SUPABASE_SECRET_KEY or SUPABASE_SERVICE_ROLE_KEY environment variable')
    }
    
    adminClient = createClient<Database>(url, secretKey, {
      auth: {
        persistSession: false
      }
    })
  }
  
  return adminClient
}
