import type { SupabaseClient } from '@supabase/supabase-js'
import { expect, test, vi } from 'vitest'
import { ShiftConflictError, assignShift, deleteShift } from './shiftsAdmin'

const shift = {
  id: 'u1:2026-10-24',
  userId: 'u1',
  code: 'N' as const,
  startsAt: '2026-10-24T20:00:00.000Z',
  endsAt: '2026-10-25T04:00:00.000Z',
}

test('assignShift inserts the row for that group, without the local id', async () => {
  const insert = vi.fn().mockResolvedValue({ error: null })
  const from = vi.fn(() => ({ insert }))
  await assignShift({ from } as unknown as SupabaseClient, 'g1', shift)
  expect(from).toHaveBeenCalledWith('shifts')
  expect(insert).toHaveBeenCalledWith({
    group_id: 'g1',
    user_id: 'u1',
    code: 'N',
    starts_at: '2026-10-24T20:00:00.000Z',
    ends_at: '2026-10-25T04:00:00.000Z',
  })
})

test('assignShift tells a clash with an existing shift from other failures', async () => {
  const clash = { from: () => ({ insert: () => Promise.resolve({ error: { code: '23505', message: 'duplicate key' } }) }) }
  await expect(assignShift(clash as unknown as SupabaseClient, 'g1', shift)).rejects.toBeInstanceOf(ShiftConflictError)
  const other = { from: () => ({ insert: () => Promise.resolve({ error: { code: '42501', message: 'denied' } }) }) }
  await expect(assignShift(other as unknown as SupabaseClient, 'g1', shift)).rejects.toThrow('denied')
})

function deleteClient(result: { data: unknown; error: { message: string } | null }) {
  const select = vi.fn().mockResolvedValue(result)
  const eqGroup = vi.fn(() => ({ select }))
  const eqId = vi.fn(() => ({ eq: eqGroup }))
  const del = vi.fn(() => ({ eq: eqId }))
  return { client: { from: () => ({ delete: del }) } as unknown as SupabaseClient, eqId, eqGroup }
}

test('deleteShift deletes that shift of that group', async () => {
  const { client, eqId, eqGroup } = deleteClient({ data: [{ id: 's1' }], error: null })
  await deleteShift(client, 'g1', 's1')
  expect(eqId).toHaveBeenCalledWith('id', 's1')
  expect(eqGroup).toHaveBeenCalledWith('group_id', 'g1')
})

test('deleteShift fails when no row was deleted, because the rules turn a refused delete into zero rows', async () => {
  const { client } = deleteClient({ data: [], error: null })
  await expect(deleteShift(client, 'g1', 's1')).rejects.toThrow(/not deleted/i)
})

test('deleteShift throws the database error', async () => {
  const { client } = deleteClient({ data: null, error: { message: 'boom' } })
  await expect(deleteShift(client, 'g1', 's1')).rejects.toThrow('boom')
})
