import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, expect, test } from 'vitest'
import type { DataSource } from '../data/DataSource'
import { DEFAULT_SHIFT_TYPES } from '../lib/cycle'
import type { Group, Shift, ShiftCode } from '../lib/types'
import { HomePage } from './HomePage'

afterEach(cleanup)

// 2026-10-19 08:00 in Rome (CEST, UTC+2).
const NOW = new Date('2026-10-19T06:00:00Z')
const group: Group = {
  id: 'g',
  name: 'Reparto prova',
  timeZone: 'Europe/Rome',
  members: [
    { id: 'me', name: 'Luca', role: 'member' },
    { id: 'a', name: 'Anna', role: 'manager' },
    { id: 'b', name: 'Marco', role: 'member' },
  ],
  shiftTypes: DEFAULT_SHIFT_TYPES,
}
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
  return {
    userId: 'me',
    group: () => Promise.resolve(group),
    shifts: () => (shifts instanceof Error ? Promise.reject(shifts) : Promise.resolve(shifts)),
  }
}
const base = [shift('me', 20, 'M'), shift('me', 21, 'P'), shift('me', 22, 'P'), shift('me', 23, 'N')]

test('shows a loading status first', () => {
  render(<HomePage source={source(base)} now={NOW} />)
  expect(screen.getByRole('status')).toHaveTextContent('Caricamento')
})

test('shows an error with retry', async () => {
  render(<HomePage source={source(new Error('x'))} now={NOW} />)
  expect(await screen.findByRole('alert')).toBeInTheDocument()
  expect(screen.getByRole('button', { name: 'Riprova' })).toBeInTheDocument()
})

test('retry reloads the data', async () => {
  let fail = true
  const s: DataSource = {
    ...source(base),
    shifts: () => (fail ? Promise.reject(new Error('x')) : Promise.resolve(base)),
  }
  render(<HomePage source={s} now={NOW} />)
  const retry = await screen.findByRole('button', { name: 'Riprova' })
  fail = false
  fireEvent.click(retry)
  expect(await screen.findByText('Nessun turno oggi')).toBeInTheDocument()
})

test('shows my shift and colleagues on the same shift', async () => {
  render(<HomePage source={source([...base, shift('me', 19, 'M'), shift('a', 19, 'M'), shift('b', 19, 'P')])} now={NOW} />)
  expect(await screen.findByText(/Il tuo turno: Mattina 06:00–14:00/)).toBeInTheDocument()
  expect(screen.getByText('Con te: Anna')).toBeInTheDocument()
})

test('shows rest when I am off', async () => {
  render(<HomePage source={source([...base, shift('me', 19, 'R'), shift('a', 19, 'R')])} now={NOW} />)
  expect(await screen.findByText('Oggi riposi')).toBeInTheDocument()
  expect(screen.queryByText(/Con te/)).not.toBeInTheDocument()
})

test('shows an empty message with no shifts today', async () => {
  render(<HomePage source={source([])} now={NOW} />)
  expect(await screen.findByText('Nessun turno oggi')).toBeInTheDocument()
  expect(screen.queryByRole('alert')).not.toBeInTheDocument()
})

test('lists the next three days', async () => {
  render(<HomePage source={source(base)} now={NOW} />)
  const list = within(await screen.findByRole('list', { name: 'Prossimi turni' }))
  expect(list.getAllByRole('listitem')).toHaveLength(3)
  expect(list.getByText(/Mar 20 ottobre/)).toBeInTheDocument()
  expect(list.getByText(/Mer 21 ottobre · Pomeriggio 14:00–22:00/)).toBeInTheDocument()
})

test('the mini month is a table with a caption and labelled days', async () => {
  const others = [shift('a', 19, 'M'), shift('b', 19, 'M'), shift('b', 20, 'R')]
  render(<HomePage source={source([...base, ...others])} now={NOW} />)
  const table = await screen.findByRole('table', { name: 'ottobre 2026' })
  expect(within(table).getByLabelText('19 ottobre, 2 in servizio')).toBeInTheDocument()
  expect(within(table).getByLabelText('20 ottobre, 1 in servizio')).toBeInTheDocument()
})
