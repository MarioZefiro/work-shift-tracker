import type { SupabaseClient } from '@supabase/supabase-js'
import { addDays, zonedToUtc } from '../../lib/time'
import type { Group, Role, Shift, ShiftCode, ShiftType } from '../../lib/types'
import type { DataSource } from '../DataSource'

interface GroupRow {
  id: string
  name: string
  time_zone: string
}
interface MemberRow {
  user_id: string
  role: Role
  profiles: { display_name: string }
}
interface ShiftTypeRow {
  code: ShiftCode
  label: string
  start_time: string
  duration_minutes: number
}
interface ShiftRow {
  id: string
  user_id: string
  code: ShiftCode
  starts_at: string
  ends_at: string
}

const CODE_ORDER: readonly ShiftCode[] = ['M', 'P', 'N', 'R']

// The client has no generated database types, so the row shapes above are asserted, not inferred.
function unwrap<T>(result: { data: unknown; error: { message: string } | null }): T {
  if (result.error) throw new Error(result.error.message)
  if (result.data === null) throw new Error('No data returned')
  return result.data as T
}

export function createSupabaseSource(client: SupabaseClient, groupId: string, userId: string): DataSource {
  let groupLoad: Promise<Group> | undefined

  async function loadGroup(): Promise<Group> {
    const [groupResult, membersResult, typesResult] = await Promise.all([
      client.from('groups').select('id, name, time_zone').eq('id', groupId).single(),
      client.from('group_members').select('user_id, role, profiles(display_name)').eq('group_id', groupId),
      client.from('shift_types').select('code, label, start_time, duration_minutes').eq('group_id', groupId),
    ])
    const group = unwrap<GroupRow>(groupResult)
    const shiftTypes: ShiftType[] = unwrap<ShiftTypeRow[]>(typesResult)
      .map((t) => ({
        code: t.code,
        label: t.label,
        // Postgres returns time as HH:MM:SS; the app works with HH:MM.
        startTime: t.start_time.slice(0, 5),
        durationMinutes: t.duration_minutes,
      }))
      .sort((a, b) => CODE_ORDER.indexOf(a.code) - CODE_ORDER.indexOf(b.code))
    return {
      id: group.id,
      name: group.name,
      timeZone: group.time_zone,
      members: unwrap<MemberRow[]>(membersResult).map((m) => ({ id: m.user_id, name: m.profiles.display_name, role: m.role })),
      shiftTypes,
    }
  }

  // Remembered so shifts() does not re-fetch the group for its time zone, but a failure is forgotten so Retry works.
  const group = () =>
    (groupLoad ??= loadGroup().catch((error) => {
      groupLoad = undefined
      throw error
    }))

  return {
    userId,
    group,
    async shifts({ from, to }) {
      const { timeZone } = await group()
      // Whole local days: a shift belongs to the day it starts, which may be 23 or 25 hours long.
      const start = zonedToUtc(from, '00:00', timeZone).toISOString()
      const end = zonedToUtc(addDays(to, 1), '00:00', timeZone).toISOString()
      const rows = unwrap<ShiftRow[]>(
        await client
          .from('shifts')
          .select('id, user_id, code, starts_at, ends_at')
          .eq('group_id', groupId)
          .gte('starts_at', start)
          .lt('starts_at', end)
          .order('starts_at'),
      )
      return rows.map(
        (r): Shift => ({
          id: r.id,
          userId: r.user_id,
          code: r.code,
          startsAt: new Date(r.starts_at).toISOString(),
          endsAt: new Date(r.ends_at).toISOString(),
        }),
      )
    },
  }
}
