import type { SupabaseClient } from '@supabase/supabase-js'
import { expect, test, vi } from 'vitest'
import { createSupabaseSource } from './supabaseSource'

type Result = { data: unknown; error: { message: string } | null }

// A query builder that records every call and resolves to the given result when awaited.
function query(result: Result) {
  const calls: [string, unknown[]][] = []
  const q: Record<string, unknown> = {
    then: (resolve: (r: Result) => unknown, reject?: (e: unknown) => unknown) => Promise.resolve(result).then(resolve, reject),
  }
  for (const name of ['select', 'eq', 'gte', 'lt', 'order', 'range', 'single']) {
    q[name] = (...args: unknown[]) => {
      calls.push([name, args])
      return q
    }
  }
  return { q, calls }
}

function clientWith(tables: Record<string, Result[]>) {
  const used: Record<string, ReturnType<typeof query>[]> = {}
  const from = vi.fn((table: string) => {
    // Results are consumed in order; the last one repeats. A table nobody declared is simply empty.
    const list = (tables[table] ??= [{ data: [], error: null }])
    const built = query(list.length > 1 ? (list.shift() as Result) : list[0])
    ;(used[table] ??= []).push(built)
    return built.q
  })
  return { client: { from } as unknown as SupabaseClient, from, used }
}

const groupRow = { data: { id: 'g1', name: 'Reparto', time_zone: 'Europe/Rome' }, error: null }
const membersRow = {
  data: [
    { user_id: 'u1', role: 'manager', profiles: { display_name: 'Anna' } },
    { user_id: 'u2', role: 'member', profiles: { display_name: 'Luca' } },
  ],
  error: null,
}
const typesRow = {
  data: [
    { code: 'N', label: 'Notte', start_time: '22:00:00', duration_minutes: 480 },
    { code: 'M', label: 'Mattina', start_time: '06:00:00', duration_minutes: 480 },
  ],
  error: null,
}

test('exposes the user id it was built for', () => {
  const { client } = clientWith({})
  expect(createSupabaseSource(client, 'g1', 'u2').userId).toBe('u2')
})

test('group() maps rows to a Group, with HH:MM times and the shift types in M, P, N, R order', async () => {
  const { client, used } = clientWith({ groups: [groupRow], group_members: [membersRow], shift_types: [typesRow] })
  const group = await createSupabaseSource(client, 'g1', 'u2').group()
  expect(group).toEqual({
    id: 'g1',
    name: 'Reparto',
    timeZone: 'Europe/Rome',
    members: [
      { id: 'u1', name: 'Anna', role: 'manager' },
      { id: 'u2', name: 'Luca', role: 'member' },
    ],
    shiftTypes: [
      { code: 'M', label: 'Mattina', startTime: '06:00', durationMinutes: 480 },
      { code: 'N', label: 'Notte', startTime: '22:00', durationMinutes: 480 },
    ],
  })
  expect(used.groups[0].calls).toContainEqual(['eq', ['id', 'g1']])
  expect(used.group_members[0].calls).toContainEqual(['eq', ['group_id', 'g1']])
  expect(used.shift_types[0].calls).toContainEqual(['eq', ['group_id', 'g1']])
})

test('shifts() asks for whole local days: from midnight of `from` to midnight after `to`, in UTC', async () => {
  const shiftsRow = { data: [], error: null }
  const { client, used } = clientWith({ groups: [groupRow], shifts: [shiftsRow] })
  // 25 October 2026 is the day the clocks go back in Rome, so that day lasts 25 hours.
  await createSupabaseSource(client, 'g1', 'u2').shifts({ from: '2026-10-24', to: '2026-10-25' })
  const calls = used.shifts[0].calls
  expect(calls).toContainEqual(['eq', ['group_id', 'g1']])
  expect(calls).toContainEqual(['gte', ['starts_at', '2026-10-23T22:00:00.000Z']])
  expect(calls).toContainEqual(['lt', ['starts_at', '2026-10-25T23:00:00.000Z']])
})

test('shifts() maps rows to Shift with ISO instants', async () => {
  const shiftsRow = {
    data: [{ id: 's1', user_id: 'u2', code: 'N', starts_at: '2026-10-24T20:00:00+00:00', ends_at: '2026-10-25T04:00:00+00:00' }],
    error: null,
  }
  const { client } = clientWith({ groups: [groupRow], shifts: [shiftsRow] })
  expect(await createSupabaseSource(client, 'g1', 'u2').shifts({ from: '2026-10-24', to: '2026-10-24' })).toEqual([
    { id: 's1', userId: 'u2', code: 'N', startsAt: '2026-10-24T20:00:00.000Z', endsAt: '2026-10-25T04:00:00.000Z' },
  ])
})

test('a database error rejects, so the screens show their error state', async () => {
  const { client } = clientWith({ groups: [{ data: null, error: { message: 'boom' } }], group_members: [membersRow], shift_types: [typesRow] })
  await expect(createSupabaseSource(client, 'g1', 'u2').group()).rejects.toThrow('boom')
})

test('a failed group load is not remembered: the retry asks the database again', async () => {
  const { client, from } = clientWith({
    groups: [{ data: null, error: { message: 'boom' } }, groupRow],
    group_members: [membersRow],
    shift_types: [typesRow],
  })
  const source = createSupabaseSource(client, 'g1', 'u2')
  await expect(source.group()).rejects.toThrow('boom')
  await expect(source.group()).resolves.toMatchObject({ name: 'Reparto' })
  expect(from.mock.calls.filter(([t]) => t === 'groups')).toHaveLength(2)
})

test('shifts() does not fetch the group again once it is known', async () => {
  const { client, from } = clientWith({
    groups: [groupRow],
    group_members: [membersRow],
    shift_types: [typesRow],
    shifts: [{ data: [], error: null }],
  })
  const source = createSupabaseSource(client, 'g1', 'u2')
  await source.group()
  await source.shifts({ from: '2026-10-24', to: '2026-10-24' })
  expect(from.mock.calls.filter(([t]) => t === 'groups')).toHaveLength(1)
})

test('shifts() reads past the 1000-row limit of the API instead of silently cutting the list', async () => {
  const row = (i: number) => ({ id: `s${i}`, user_id: 'u1', code: 'M', starts_at: '2026-10-24T04:00:00Z', ends_at: '2026-10-24T12:00:00Z' })
  const firstPage = { data: Array.from({ length: 1000 }, (_, i) => row(i)), error: null }
  const secondPage = { data: [row(1000), row(1001), row(1002)], error: null }
  const { client, used } = clientWith({ groups: [groupRow], shifts: [firstPage, secondPage] })
  const result = await createSupabaseSource(client, 'g1', 'u2').shifts({ from: '2026-10-24', to: '2026-10-24' })
  expect(result).toHaveLength(1003)
  expect(used.shifts[0].calls).toContainEqual(['range', [0, 999]])
  expect(used.shifts[1].calls).toContainEqual(['range', [1000, 1999]])
  // Ties on starts_at need a second sort key, or a row could appear on two pages or on none.
  expect(used.shifts[0].calls).toContainEqual(['order', ['id']])
})

test('shifts() stops after a short page', async () => {
  const { client, from } = clientWith({ groups: [groupRow], shifts: [{ data: [], error: null }] })
  await createSupabaseSource(client, 'g1', 'u2').shifts({ from: '2026-10-24', to: '2026-10-24' })
  expect(from.mock.calls.filter(([t]) => t === 'shifts')).toHaveLength(1)
})
