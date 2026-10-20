import type { SupabaseClient } from '@supabase/supabase-js'
import { createSupabaseClient } from './client'

let client: SupabaseClient | undefined

// Lazy: the demo must keep working when the Supabase variables are absent.
export function getSupabase(): SupabaseClient {
  client ??= createSupabaseClient({
    url: import.meta.env.VITE_SUPABASE_URL,
    key: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
  })
  return client
}

// null when the variables are absent, so the app starts with the demo only instead of failing.
export function tryGetSupabase(): SupabaseClient | null {
  return import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ? getSupabase() : null
}
