import type { SupabaseClient } from '@supabase/supabase-js'
import type { Shift } from '../../lib/types'

// The same member cannot start two shifts at the same instant (unique key in the schema).
export class ShiftConflictError extends Error {}

export async function assignShift(client: SupabaseClient, groupId: string, shift: Shift): Promise<void> {
  // The id of a built Shift is local ("user:date"); the database makes its own.
  const { error } = await client.from('shifts').insert({
    group_id: groupId,
    user_id: shift.userId,
    code: shift.code,
    starts_at: shift.startsAt,
    ends_at: shift.endsAt,
  })
  if (error) throw error.code === '23505' ? new ShiftConflictError(error.message) : new Error(error.message)
}

export async function deleteShift(client: SupabaseClient, groupId: string, shiftId: string): Promise<void> {
  // The rules turn a refused delete into zero rows rather than an error, so an empty result is a failure.
  const { data, error } = await client.from('shifts').delete().eq('id', shiftId).eq('group_id', groupId).select('id')
  if (error) throw new Error(error.message)
  if (!data || data.length === 0) throw new Error('Shift not deleted')
}
