import type { SupabaseClient } from '@supabase/supabase-js'
import type { Role } from '../../lib/types'

export interface MyGroup {
  id: string
  name: string
  role: Role
}

export interface InviteInfo {
  groupName: string
  memberCount: number
}

export class InvalidInviteError extends Error {}
export class GroupFullError extends Error {}

type DbError = { code?: string; message: string }

// The codes come from the functions in supabase/migrations/*_rpc.sql.
function toError(error: DbError): Error {
  if (error.code === 'P0002') return new InvalidInviteError(error.message)
  if (error.code === 'P0001' && error.message === 'group is full') return new GroupFullError(error.message)
  return new Error(error.message)
}

export async function listMyGroups(client: SupabaseClient, userId: string): Promise<MyGroup[]> {
  // Members of my groups are visible too, so the user filter is what makes this "my" groups.
  const { data, error } = await client.from('group_members').select('role, groups(id, name)').eq('user_id', userId)
  if (error) throw new Error(error.message)
  return (data as unknown as { role: Role; groups: { id: string; name: string } }[]).map((r) => ({
    id: r.groups.id,
    name: r.groups.name,
    role: r.role,
  }))
}

export async function createGroup(client: SupabaseClient, name: string): Promise<string> {
  const { data, error } = await client.rpc('create_group', { p_name: name })
  if (error) throw toError(error)
  return data as string
}

export async function createInvite(
  client: SupabaseClient,
  groupId: string,
  opts: { maxUses?: number; days?: number } = {},
): Promise<string> {
  const { data, error } = await client.rpc('create_invite', {
    p_group_id: groupId,
    p_max_uses: opts.maxUses ?? 1,
    p_days: opts.days ?? 7,
  })
  if (error) throw toError(error)
  return data as string
}

// An invalid invite is an expected answer, so it is null; only real failures (network...) throw.
export async function previewInvite(client: SupabaseClient, code: string): Promise<InviteInfo | null> {
  const { data, error } = await client.rpc('preview_invite', { p_code: code })
  if (error) {
    const failure = toError(error)
    if (failure instanceof InvalidInviteError) return null
    throw failure
  }
  const row = (data as { group_name: string; member_count: number }[] | null)?.[0]
  return row ? { groupName: row.group_name, memberCount: row.member_count } : null
}

export async function acceptInvite(client: SupabaseClient, code: string): Promise<string> {
  const { data, error } = await client.rpc('accept_invite', { p_code: code })
  if (error) throw toError(error)
  return data as string
}
