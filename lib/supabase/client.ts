import { createBrowserClient } from "@supabase/ssr";
import { Database } from "@/types/database";

export function createSupabaseBrowserClient() {
  const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const SUPABASE_PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!SUPABASE_URL) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL environment variable");
  }

  if (!SUPABASE_PUBLISHABLE_KEY) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable");
  }

  return createBrowserClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    auth: {
      persistSession: true,
      detectSessionInUrl: true,
      autoRefreshToken: true,
    },
    realtime: {
      params: {
        eventsPerSecond: 2
      }
    },
    global: {
      fetch: (url, options = {}) => {
        const controller = new AbortController()
        const timeout = setTimeout(() => controller.abort(), 5000)
        
        return fetch(url, {
          ...options,
          signal: controller.signal
        }).finally(() => clearTimeout(timeout))
      }
    }
  });
}
