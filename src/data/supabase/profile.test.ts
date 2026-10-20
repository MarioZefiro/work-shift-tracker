import type { SupabaseClient } from '@supabase/supabase-js'
import { expect, test, vi } from 'vitest'
import { profileExists, saveProfile } from './profile'

type Result = { data: { id: string } | null; error: { message: string } | null }

function clientFor(result: Result, insertResult: { error: { message: string } | null } = { error: null }) {
  const eq = vi.fn(() => ({ maybeSingle: () => Promise.resolve(result) }))
  const insert = vi.fn(() => Promise.resolve(insertResult))
  const from = vi.fn(() => ({ select: () => ({ eq }), insert }))
  return { client: { from } as unknown as SupabaseClient, from, eq, insert }
}

test('profileExists asks the profiles table for that user id', async () => {
  const { client, from, eq } = clientFor({ data: { id: 'u1' }, error: null })
  expect(await profileExists(client, 'u1')).toBe(true)
  expect(from).toHaveBeenCalledWith('profiles')
  expect(eq).toHaveBeenCalledWith('id', 'u1')
})

test('profileExists is false when there is no row yet', async () => {
  const { client } = clientFor({ data: null, error: null })
  expect(await profileExists(client, 'u1')).toBe(false)
})

test('profileExists throws the database error instead of pretending there is no profile', async () => {
  const { client } = clientFor({ data: null, error: { message: 'boom' } })
  await expect(profileExists(client, 'u1')).rejects.toThrow('boom')
})

test('saveProfile inserts the id and the trimmed display name', async () => {
  const { client, insert } = clientFor({ data: null, error: null })
  await saveProfile(client, 'u1', '  Luca ')
  expect(insert).toHaveBeenCalledWith({ id: 'u1', display_name: 'Luca' })
})

test('saveProfile throws the database error', async () => {
  const { client } = clientFor({ data: null, error: null }, { error: { message: 'denied' } })
  await expect(saveProfile(client, 'u1', 'Luca')).rejects.toThrow('denied')
})
