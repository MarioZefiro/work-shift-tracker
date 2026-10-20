import type { SupabaseClient } from '@supabase/supabase-js'
import type { Shift } from '../../lib/types'

// The same member cannot start two shifts at the same instant (unique key in the schema).
export class ShiftConflictError extends Error {}

// The id of a built Shift is local ("user:date"); the database makes its own.
const toRow = (groupId: string, shift: Shift) => ({
  group_id: groupId,
  user_id: shift.userId,
  code: shift.code,
  starts_at: shift.startsAt,
  ends_at: shift.endsAt,
})

const fail = (error: { code?: string; message: string }) =>
  error.code === '23505' ? new ShiftConflictError(error.message) : new Error(error.message)

export async function assignShift(client: SupabaseClient, groupId: string, shift: Shift): Promise<void> {
  const { error } = await client.from('shifts').insert(toRow(groupId, shift))
  if (error) throw fail(error)
}

// One request, so a clash on any row rejects the whole batch instead of leaving half a rotation behind.
export async function assignShifts(client: SupabaseClient, groupId: string, shifts: Shift[]): Promise<void> {
  if (shifts.length === 0) return
  const { error } = await client.from('shifts').insert(shifts.map((s) => toRow(groupId, s)))
  if (error) throw fail(error)
}

export async function deleteShift(client: SupabaseClient, groupId: string, shiftId: string): Promise<void> {
  // The rules turn a refused delete into zero rows rather than an error, so an empty result is a failure.
  const { data, error } = await client.from('shifts').delete().eq('id', shiftId).eq('group_id', groupId).select('id')
  if (error) throw new Error(error.message)
  if (!data || data.length === 0) throw new Error('Shift not deleted')
}
