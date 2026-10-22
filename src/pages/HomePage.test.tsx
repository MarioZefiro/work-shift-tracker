import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import { expect, test, vi } from 'vitest'
import type { DataSource } from '../data/DataSource'
import type { Shift, ShiftCode } from '../lib/types'
import { makeSource, testGroup } from '../test-utils'
import { HomePage } from './HomePage'
import { renderWithI18n } from '../i18n/test-utils'

// 2026-10-19 08:00 in Rome (CEST, UTC+2).
const NOW = new Date('2026-10-19T06:00:00Z')
const group = testGroup
const HOURS: Record<ShiftCode, [string, string]> = {
  M: ['04:00', '12:00'],
  P: ['12:00', '20:00'],
  N: ['20:00', '04:00'],
  R: ['00:00', '00:00'],
}
function shift(userId: string, day: number, code: ShiftCode): Shift {
  const d = String(day).padStart(2, '0')
  return {
    id: `${userId}-${day}`,
    userId,
    code,
    startsAt: `2026-10-${d}T${HOURS[code][0]}:00Z`,
    endsAt: `2026-10-${d}T${HOURS[code][1]}:00Z`,
  }
}
function source(shifts: Shift[] | Error): DataSource {
  return makeSource({ shifts: () => (shifts instanceof Error ? Promise.reject(shifts) : Promise.resolve(shifts)) })
}
const base = [shift('me', 20, 'M'), shift('me', 21, 'P'), shift('me', 22, 'P'), shift('me', 23, 'N')]

test('shows a loading status first', () => {
  renderWithI18n(<HomePage source={source(base)} now={NOW} />)
  expect(screen.getByRole('status')).toHaveTextContent('Caricamento')
})

test('shows an error with retry', async () => {
  renderWithI18n(<HomePage source={source(new Error('x'))} now={NOW} />)
  expect(await screen.findByRole('alert')).toBeInTheDocument()
  expect(screen.getByRole('button', { name: 'Riprova' })).toBeInTheDocument()
})

test('retry reloads the data', async () => {
  let fail = true
  const s: DataSource = {
    ...source(base),
    shifts: () => (fail ? Promise.reject(new Error('x')) : Promise.resolve(base)),
  }
  renderWithI18n(<HomePage source={s} now={NOW} />)
  const retry = await screen.findByRole('button', { name: 'Riprova' })
  fail = false
  fireEvent.click(retry)
  expect(await screen.findByText('Nessun turno oggi')).toBeInTheDocument()
})

test('shows my shift and colleagues on the same shift', async () => {
  renderWithI18n(<HomePage source={source([...base, shift('me', 19, 'M'), shift('a', 19, 'M'), shift('b', 19, 'P')])} now={NOW} />)
  expect(await screen.findByText(/Il tuo turno: Mattina 06:00–14:00/)).toBeInTheDocument()
  expect(screen.getByText('Con te: Anna')).toBeInTheDocument()
})

test('shows rest when I am off', async () => {
  renderWithI18n(<HomePage source={source([...base, shift('me', 19, 'R'), shift('a', 19, 'R')])} now={NOW} />)
  expect(await screen.findByText('Oggi riposi')).toBeInTheDocument()
  expect(screen.queryByText(/Con te/)).not.toBeInTheDocument()
})

test('shows an empty message with no shifts today', async () => {
  renderWithI18n(<HomePage source={source([])} now={NOW} />)
  expect(await screen.findByText('Nessun turno oggi')).toBeInTheDocument()
  expect(screen.queryByRole('alert')).not.toBeInTheDocument()
})

test('lists the next three days', async () => {
  renderWithI18n(<HomePage source={source(base)} now={NOW} />)
  const list = within(await screen.findByRole('list', { name: 'Prossimi turni' }))
  expect(list.getAllByRole('listitem')).toHaveLength(3)
  expect(list.getByText(/Mar 20 ottobre/)).toBeInTheDocument()
  expect(list.getByText(/Mer 21 ottobre · Pomeriggio 14:00–22:00/)).toBeInTheDocument()
})

test('the mini month is a table with a caption and labelled days', async () => {
  const others = [shift('a', 19, 'M'), shift('b', 19, 'M'), shift('b', 20, 'R')]
  renderWithI18n(<HomePage source={source([...base, ...others])} now={NOW} />)
  const table = await screen.findByRole('table', { name: 'ottobre 2026' })
  expect(within(table).getByLabelText('19 ottobre, 2 in servizio')).toBeInTheDocument()
  expect(within(table).getByLabelText('20 ottobre, 1 in servizio')).toBeInTheDocument()
})

test('ignores a superseded load that resolves last', async () => {
  const resolvers: ((s: Shift[]) => void)[] = []
  const s: DataSource = {
    ...source([]),
    shifts: () => new Promise<Shift[]>((res) => resolvers.push(res)),
  }
  const { rerender } = renderWithI18n(<HomePage source={s} now={NOW} />)
  await waitFor(() => expect(resolvers).toHaveLength(1))
  rerender(<HomePage source={s} now={new Date(NOW)} />)
  await waitFor(() => expect(resolvers).toHaveLength(2))
  resolvers[1]([shift('me', 19, 'R')])
  expect(await screen.findByText('Oggi riposi')).toBeInTheDocument()
  resolvers[0]([shift('me', 19, 'M')])
  await new Promise((r) => setTimeout(r, 0))
  expect(screen.getByText('Oggi riposi')).toBeInTheDocument()
})

test('falls back to the shift code when the group lacks that shift type', async () => {
  const s: DataSource = {
    ...source(base),
    group: () => Promise.resolve({ ...group, shiftTypes: group.shiftTypes.filter((t) => t.code !== 'M') }),
  }
  renderWithI18n(<HomePage source={s} now={NOW} />)
  expect(await screen.findByText(/Mar 20 ottobre · M$/)).toBeInTheDocument()
})

test.each([
  ['2026-10-31T12:00:00Z', '2026-10-01', '2026-11-03'],
  ['2026-12-31T12:00:00Z', '2026-12-01', '2027-01-03'],
])('at month end (%s) asks for the range %s to %s', async (nowIso, from, to) => {
  const shifts = vi.fn(() => Promise.resolve([] as Shift[]))
  renderWithI18n(<HomePage source={makeSource({ shifts })} now={new Date(nowIso)} />)
  await screen.findByText('Nessun turno oggi')
  expect(shifts).toHaveBeenCalledWith({ from, to })
})
