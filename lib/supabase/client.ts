import { createBrowserClient } from '@supabase/ssr'
import { Database } from '@/types/database'

export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
  
  if (!url || !publishableKey) {
    throw new Error(`Missing Supabase environment variables: url=${!!url}, publishableKey=${!!publishableKey}`)
  }
  
  return createBrowserClient<Database>(url, publishableKey)
}
