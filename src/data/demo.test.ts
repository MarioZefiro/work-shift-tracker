import { describe, expect, it } from 'vitest'
import { localDateIn } from '../lib/time'
import { createDemoSource } from './demo'

const NOW = new Date('2026-03-18T10:00:00Z') // Wednesday; Monday is 2026-03-16
const WIDE = { from: '2000-01-01', to: '2100-01-01' }

describe('createDemoSource', () => {
  it('has five invented members and one manager', async () => {
    const g = await createDemoSource(NOW).group()
    expect(g.members.map((m) => m.name)).toEqual(['Anna', 'Luca', 'Sara', 'Marco', 'Elena'])
    expect(g.members.filter((m) => m.role === 'manager')).toHaveLength(1)
    expect(g.name).toBe('Reparto demo')
    expect(g.timeZone).toBe('Europe/Rome')
  })

  it('the current user belongs to the group', async () => {
    const ds = createDemoSource(NOW)
    expect((await ds.group()).members.map((m) => m.id)).toContain(ds.userId)
  })

  it('is deterministic for a fixed now', async () => {
    expect(await createDemoSource(NOW).shifts(WIDE)).toEqual(await createDemoSource(NOW).shifts(WIDE))
  })

  it('covers eight weeks starting from the Monday of the current week', async () => {
    const all = await createDemoSource(NOW).shifts(WIDE)
    const mine = all.filter((s) => s.userId === all[0].userId)
    expect(mine).toHaveLength(56)
    expect(localDateIn(new Date(mine[0].startsAt), 'Europe/Rome')).toBe('2026-03-16')
    expect(all).toHaveLength(56 * 5)
  })

  it('uses a different cycle offset per member', async () => {
    const all = await createDemoSource(NOW).shifts({ from: '2026-03-16', to: '2026-03-16' })
    expect(new Set(all.map((s) => s.code)).size).toBeGreaterThan(1)
  })

  it('shifts() filters by inclusive local date range', async () => {
    const r = await createDemoSource(NOW).shifts({ from: '2026-03-17', to: '2026-03-18' })
    expect(r).toHaveLength(2 * 5)
    expect(r.every((s) => ['2026-03-17', '2026-03-18'].includes(s.id.split(':')[1]))).toBe(true)
  })
})
