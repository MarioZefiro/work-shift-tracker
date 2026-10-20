import type { SupabaseClient } from '@supabase/supabase-js'

// A database error must surface: reading it as "no profile" would ask a signed-in user for their name again.
export async function profileExists(client: SupabaseClient, userId: string): Promise<boolean> {
  const { data, error } = await client.from('profiles').select('id').eq('id', userId).maybeSingle()
  if (error) throw new Error(error.message)
  return data !== null
}

export async function saveProfile(client: SupabaseClient, userId: string, name: string): Promise<void> {
  const { error } = await client.from('profiles').insert({ id: userId, display_name: name.trim() })
  if (error) throw new Error(error.message)
}
