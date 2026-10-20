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
