import { cleanup, fireEvent, screen, waitFor } from '@testing-library/react'
import { afterEach, expect, test, vi } from 'vitest'
import { ShiftConflictError } from '../data/supabase/shiftsAdmin'
import { renderWithI18n } from '../i18n/test-utils'
import { makeSource } from '../test-utils'
import { ManagePage } from './ManagePage'

afterEach(cleanup)

const NOW = new Date('2026-10-20T12:00:00Z')

function setup(overrides: Partial<Parameters<typeof ManagePage>[0]> = {}) {
  const shifts = vi.fn().mockResolvedValue([
    { id: 's1', userId: 'me', code: 'M', startsAt: '2026-10-21T04:00:00Z', endsAt: '2026-10-21T12:00:00Z' },
  ])
  const props = {
    source: makeSource({ shifts }),
    now: NOW,
    isManager: true,
    onAssign: vi.fn().mockResolvedValue(undefined),
    onDelete: vi.fn().mockResolvedValue(undefined),
    onGenerate: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  }
  renderWithI18n(<ManagePage {...props} />)
  return { ...props, shifts }
}

test('a member is told only the manager can assign shifts, and gets no form', async () => {
  setup({ isManager: false })
  expect(await screen.findByText(/Solo il responsabile/)).toBeInTheDocument()
  expect(screen.queryByRole('button', { name: 'Assegna turno' })).not.toBeInTheDocument()
})

test('asks for this month and the next, so a shift can be placed ahead of time', async () => {
  const { shifts } = setup()
  await screen.findByRole('button', { name: 'Assegna turno' })
  expect(shifts).toHaveBeenCalledWith({ from: '2026-10-01', to: '2026-11-30' })
})

test('assigns the night of 24 October to a member, built with the group time zone', async () => {
  const { onAssign } = setup()
  fireEvent.change(await screen.findByLabelText('Persona'), { target: { value: 'b' } })
  fireEvent.change(screen.getByLabelText('Data'), { target: { value: '2026-10-24' } })
  fireEvent.change(screen.getByLabelText('Turno'), { target: { value: 'N' } })
  fireEvent.click(screen.getByRole('button', { name: 'Assegna turno' }))
  await waitFor(() =>
    expect(onAssign).toHaveBeenCalledWith({
      id: 'b:2026-10-24',
      userId: 'b',
      code: 'N',
      startsAt: '2026-10-24T20:00:00.000Z',
      endsAt: '2026-10-25T04:00:00.000Z',
    }),
  )
})

test('reloads the list after an assignment', async () => {
  const { shifts } = setup()
  fireEvent.change(await screen.findByLabelText('Data'), { target: { value: '2026-10-24' } })
  fireEvent.click(screen.getByRole('button', { name: 'Assegna turno' }))
  await waitFor(() => expect(shifts).toHaveBeenCalledTimes(2))
})

test('lists the assigned shifts with who and when, and deletes one', async () => {
  const { onDelete } = setup()
  const del = await screen.findByRole('button', { name: /Cancella.*Luca/ })
  fireEvent.click(del)
  await waitFor(() => expect(onDelete).toHaveBeenCalledWith('s1'))
})

test('does not assign a second shift on a day that member already has one', async () => {
  const { onAssign } = setup()
  fireEvent.change(await screen.findByLabelText('Persona'), { target: { value: 'me' } })
  fireEvent.change(screen.getByLabelText('Data'), { target: { value: '2026-10-21' } })
  fireEvent.click(screen.getByRole('button', { name: 'Assegna turno' }))
  expect(await screen.findByRole('alert')).toHaveTextContent('Luca ha già un turno')
  expect(onAssign).not.toHaveBeenCalled()
})

test('says so when the database reports a clash that the list did not show', async () => {
  setup({ onAssign: () => Promise.reject(new ShiftConflictError('dup')) })
  fireEvent.change(await screen.findByLabelText('Data'), { target: { value: '2026-10-24' } })
  fireEvent.click(screen.getByRole('button', { name: 'Assegna turno' }))
  expect(await screen.findByRole('alert')).toHaveTextContent('ha già un turno')
})

test('shows an alert when assigning or deleting fails for another reason', async () => {
  setup({ onAssign: () => Promise.reject(new Error('x')), onDelete: () => Promise.reject(new Error('x')) })
  fireEvent.change(await screen.findByLabelText('Data'), { target: { value: '2026-10-24' } })
  fireEvent.click(screen.getByRole('button', { name: 'Assegna turno' }))
  expect(await screen.findByRole('alert')).toHaveTextContent('Non sono riuscito ad assegnare il turno')
  fireEvent.click(screen.getByRole('button', { name: /Cancella.*Luca/ }))
  await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('Non sono riuscito a cancellare il turno'))
})

// The rotation form: pick who takes part and where in the cycle each one starts.
async function pickPerson(name: string, position: string) {
  fireEvent.change(await screen.findByLabelText(`Posizione di partenza di ${name}`), { target: { value: position } })
}

test('generates the three-shift rotation only for the people that were picked', async () => {
  const { onGenerate } = setup()
  await pickPerson('Luca', '0')
  fireEvent.change(screen.getByLabelText('Data di inizio'), { target: { value: '2026-10-26' } })
  fireEvent.change(screen.getByLabelText('Settimane'), { target: { value: '1' } })
  fireEvent.click(screen.getByRole('button', { name: 'Genera turnazione' }))
  await waitFor(() => expect(onGenerate).toHaveBeenCalledOnce())
  const shifts = vi.mocked(onGenerate).mock.calls[0][0]
  expect(shifts).toHaveLength(7)
  expect(new Set(shifts.map((s: { userId: string }) => s.userId))).toEqual(new Set(['me']))
  // The clocks went back on 25 October, so 06:00 in Rome is 05:00 UTC from the 26th.
  expect(shifts[0]).toMatchObject({ code: 'M', startsAt: '2026-10-26T05:00:00.000Z' })
})

test('shows the first two weeks of each picked person before anything is saved', async () => {
  const { onGenerate } = setup()
  await pickPerson('Luca', '2')
  fireEvent.change(screen.getByLabelText('Data di inizio'), { target: { value: '2026-10-19' } })
  expect(screen.getByText('P P N N R R M M P P N N R R')).toBeInTheDocument()
  expect(onGenerate).not.toHaveBeenCalled()
})

test('asks to pick at least one person instead of generating nothing', async () => {
  const { onGenerate } = setup()
  fireEvent.click(await screen.findByRole('button', { name: 'Genera turnazione' }))
  expect(await screen.findByRole('alert')).toHaveTextContent('Scegli almeno una persona')
  expect(onGenerate).not.toHaveBeenCalled()
})

test('refuses to generate over days where a picked person already has a shift', async () => {
  const { onGenerate } = setup()
  await pickPerson('Luca', '0')
  fireEvent.change(screen.getByLabelText('Data di inizio'), { target: { value: '2026-10-19' } })
  fireEvent.change(screen.getByLabelText('Settimane'), { target: { value: '1' } })
  fireEvent.click(screen.getByRole('button', { name: 'Genera turnazione' }))
  expect(await screen.findByRole('alert')).toHaveTextContent('Luca ha già dei turni')
  expect(onGenerate).not.toHaveBeenCalled()
})

test('reloads the list after generating, and shows an alert if it fails', async () => {
  const { shifts, onGenerate } = setup()
  await pickPerson('Anna', '0')
  fireEvent.change(screen.getByLabelText('Data di inizio'), { target: { value: '2026-10-19' } })
  fireEvent.click(screen.getByRole('button', { name: 'Genera turnazione' }))
  await waitFor(() => expect(shifts).toHaveBeenCalledTimes(2))
  // Reloading the list must not wipe the form: Anna is still picked.
  expect(screen.getByLabelText('Posizione di partenza di Anna')).toHaveValue('0')
  vi.mocked(onGenerate).mockRejectedValueOnce(new Error('x'))
  fireEvent.click(screen.getByRole('button', { name: 'Genera turnazione' }))
  expect(await screen.findByRole('alert')).toHaveTextContent('Non sono riuscito a generare la turnazione')
})
