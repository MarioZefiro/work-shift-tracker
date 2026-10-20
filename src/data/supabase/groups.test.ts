import type { SupabaseClient } from '@supabase/supabase-js'
import { expect, test, vi } from 'vitest'
import {
  GroupFullError,
  InvalidInviteError,
  acceptInvite,
  createGroup,
  createInvite,
  listMyGroups,
  previewInvite,
} from './groups'

type Result = { data: unknown; error: { code?: string; message: string } | null }

function rpcClient(result: Result) {
  const rpc = vi.fn().mockResolvedValue(result)
  return { client: { rpc } as unknown as SupabaseClient, rpc }
}

test('listMyGroups reads the memberships of that user with the group name', async () => {
  const eq = vi.fn().mockResolvedValue({
    data: [{ role: 'manager', groups: { id: 'g1', name: 'Reparto' } }],
    error: null,
  })
  const select = vi.fn(() => ({ eq }))
  const from = vi.fn(() => ({ select }))
  const groups = await listMyGroups({ from } as unknown as SupabaseClient, 'u1')
  expect(from).toHaveBeenCalledWith('group_members')
  expect(eq).toHaveBeenCalledWith('user_id', 'u1')
  expect(groups).toEqual([{ id: 'g1', name: 'Reparto', role: 'manager' }])
})

test('listMyGroups throws the database error', async () => {
  const eq = vi.fn().mockResolvedValue({ data: null, error: { message: 'boom' } })
  const client = { from: () => ({ select: () => ({ eq }) }) } as unknown as SupabaseClient
  await expect(listMyGroups(client, 'u1')).rejects.toThrow('boom')
})

test('createGroup calls create_group and returns the new id', async () => {
  const { client, rpc } = rpcClient({ data: 'g1', error: null })
  expect(await createGroup(client, 'Reparto')).toBe('g1')
  expect(rpc).toHaveBeenCalledWith('create_group', { p_name: 'Reparto' })
})

test('createInvite passes the group and the defaults of the design: one use, seven days', async () => {
  const { client, rpc } = rpcClient({ data: 'abc', error: null })
  expect(await createInvite(client, 'g1')).toBe('abc')
  expect(rpc).toHaveBeenCalledWith('create_invite', { p_group_id: 'g1', p_max_uses: 1, p_days: 7 })
})

test('createInvite passes the options it is given', async () => {
  const { client, rpc } = rpcClient({ data: 'abc', error: null })
  await createInvite(client, 'g1', { maxUses: 5, days: 30 })
  expect(rpc).toHaveBeenCalledWith('create_invite', { p_group_id: 'g1', p_max_uses: 5, p_days: 30 })
})

test('previewInvite returns the group name and member count', async () => {
  const { client, rpc } = rpcClient({ data: [{ group_name: 'Reparto', member_count: 3 }], error: null })
  expect(await previewInvite(client, 'abc')).toEqual({ groupName: 'Reparto', memberCount: 3 })
  expect(rpc).toHaveBeenCalledWith('preview_invite', { p_code: 'abc' })
})

test('previewInvite returns null for an invalid invite, which is an expected case', async () => {
  const { client } = rpcClient({ data: null, error: { code: 'P0002', message: 'invalid invite' } })
  expect(await previewInvite(client, 'abc')).toBeNull()
})

test('previewInvite still throws other errors, such as a network failure', async () => {
  const { client } = rpcClient({ data: null, error: { message: 'Failed to fetch' } })
  await expect(previewInvite(client, 'abc')).rejects.toThrow('Failed to fetch')
})

test('acceptInvite returns the group id', async () => {
  const { client, rpc } = rpcClient({ data: 'g1', error: null })
  expect(await acceptInvite(client, 'abc')).toBe('g1')
  expect(rpc).toHaveBeenCalledWith('accept_invite', { p_code: 'abc' })
})

test('acceptInvite tells an invalid invite from a full group', async () => {
  await expect(
    acceptInvite(rpcClient({ data: null, error: { code: 'P0002', message: 'invalid invite' } }).client, 'abc'),
  ).rejects.toBeInstanceOf(InvalidInviteError)
  await expect(
    acceptInvite(rpcClient({ data: null, error: { code: 'P0001', message: 'group is full' } }).client, 'abc'),
  ).rejects.toBeInstanceOf(GroupFullError)
})
