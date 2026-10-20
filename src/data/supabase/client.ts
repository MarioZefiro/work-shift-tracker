import { createClient, type SupabaseClient } from '@supabase/supabase-js'

// Fails with the variable name: supabase-js alone reports a cryptic "supabaseUrl is required".
export function createSupabaseClient(env: { url?: string; key?: string }): SupabaseClient {
  if (!env.url) throw new Error('Missing VITE_SUPABASE_URL: set it in .env.local')
  if (!env.key) throw new Error('Missing VITE_SUPABASE_PUBLISHABLE_KEY: set it in .env.local')
  return createClient(env.url, env.key)
}
