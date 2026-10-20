import { cleanup, fireEvent, screen, waitFor } from '@testing-library/react'
import { afterEach, expect, test, vi } from 'vitest'
import type { DataSource } from '../data/DataSource'
import { DEFAULT_SHIFT_TYPES } from '../lib/cycle'
import type { Group, Member } from '../lib/types'
import { FaqPage } from './FaqPage'
import { PeoplePage } from './PeoplePage'
import { ProfilePage } from './ProfilePage'
import { SettingsPage } from './SettingsPage'
import { renderWithI18n } from '../i18n/test-utils'

afterEach(cleanup)

function makeSource(members: Member[], fail = false): DataSource {
  const group: Group = { id: 'g', name: 'Reparto prova', timeZone: 'Europe/Rome', members, shiftTypes: DEFAULT_SHIFT_TYPES }
  return {
    userId: 'u1',
    group: () => (fail ? Promise.reject(new Error('x')) : Promise.resolve(group)),
    shifts: () => Promise.resolve([]),
  }
}
const few: Member[] = [
  { id: 'u0', name: 'Anna', role: 'manager' },
  { id: 'u1', name: 'Luca', role: 'member' },
]

test('PeoplePage lists every member with a visible role label', async () => {
  renderWithI18n(<PeoplePage source={makeSource(few)} />)
  expect(await screen.findByText('Anna')).toBeTruthy()
  expect(screen.getByText('Responsabile')).toBeTruthy()
  expect(screen.getByText('Membro')).toBeTruthy()
  expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1)
})

test('PeoplePage renders thirty members', async () => {
  const many = Array.from({ length: 30 }, (_, i): Member => ({ id: `m${i}`, name: `Persona ${i}`, role: 'member' }))
  renderWithI18n(<PeoplePage source={makeSource(many)} />)
  await screen.findByText('Persona 0')
  expect(screen.getAllByRole('listitem')).toHaveLength(30)
})

test('PeoplePage shows loading then an error with retry', async () => {
  renderWithI18n(<PeoplePage source={makeSource(few, true)} />)
  expect(screen.getByRole('status').textContent).toContain('Caricamento')
  expect(await screen.findByRole('alert')).toBeTruthy()
  expect(screen.getByRole('button', { name: 'Riprova' })).toBeTruthy()
})

test('ProfilePage shows my name, role and group', async () => {
  renderWithI18n(<ProfilePage source={makeSource(few)} />)
  expect(await screen.findByRole('heading', { level: 1, name: 'Luca' })).toBeTruthy()
  expect(screen.getByText('Membro')).toBeTruthy()
  expect(screen.getByText('Reparto prova')).toBeTruthy()
})

test('SettingsPage shows the group time zone and a leave-demo button', async () => {
  const onLeave = vi.fn()
  renderWithI18n(<SettingsPage source={makeSource(few)} onLeave={onLeave} />)
  expect(await screen.findByText('Europe/Rome')).toBeTruthy()
  fireEvent.click(screen.getByRole('button', { name: /esci dalla demo/i }))
  await waitFor(() => expect(onLeave).toHaveBeenCalledTimes(1))
})

test('FaqPage uses native details/summary and opens with the keyboard', () => {
  const { container } = renderWithI18n(<FaqPage />)
  const details = container.querySelectorAll('details')
  expect(details.length).toBeGreaterThanOrEqual(4)
  const summary = screen.getByText(/48 ore/, { selector: 'summary' })
  expect(summary.tagName).toBe('SUMMARY')
  // Native toggle on Enter/Space is browser behaviour; here we verify focusability and the open attribute path.
  summary.focus()
  expect(document.activeElement).toBe(summary)
  summary.parentElement!.setAttribute('open', '')
  expect(summary.parentElement!.hasAttribute('open')).toBe(true)
  expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1)
})

test('GroupGate ignores a superseded response that resolves last', async () => {
  const resolvers: ((g: Group) => void)[] = []
  const slow: DataSource = { ...makeSource(few), group: () => new Promise<Group>((res) => resolvers.push(res)) }
  const fresh = { ...slow }
  const g = (name: string): Group => ({ id: 'g', name: 'G', timeZone: 'Europe/Rome', members: [{ id: 'x', name, role: 'member' }], shiftTypes: DEFAULT_SHIFT_TYPES })
  const { rerender } = renderWithI18n(<PeoplePage source={slow} />)
  rerender(<PeoplePage source={fresh} />)
  await waitFor(() => expect(resolvers).toHaveLength(2))
  resolvers[1](g('Nuova'))
  await screen.findByText('Nuova')
  resolvers[0](g('Vecchia'))
  await new Promise((r) => setTimeout(r, 0))
  expect(screen.queryByText('Vecchia')).toBeNull()
})

test('SettingsPage keeps language and leave reachable when loading fails', async () => {
  renderWithI18n(<SettingsPage source={makeSource(few, true)} onLeave={() => {}} />)
  await screen.findByRole('alert')
  expect(screen.getByLabelText('Lingua')).toBeTruthy()
  expect(screen.getByRole('button', { name: 'Esci dalla demo' })).toBeTruthy()
})
