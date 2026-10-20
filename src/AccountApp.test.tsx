import type { SupabaseClient } from '@supabase/supabase-js'
import { cleanup, fireEvent, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import { AccountApp } from './AccountApp'
import { acceptInvite, createGroup, createInvite, listMyGroups, previewInvite } from './data/supabase/groups'
import { readPendingInvite, rememberInvite } from './data/supabase/pendingInvite'
import { profileExists, saveProfile } from './data/supabase/profile'
import { assignShift } from './data/supabase/shiftsAdmin'
import { createSupabaseSource } from './data/supabase/supabaseSource'
import { renderWithI18n } from './i18n/test-utils'
import { makeSource } from './test-utils'

vi.mock('./data/supabase/profile', () => ({ profileExists: vi.fn(), saveProfile: vi.fn() }))
vi.mock('./data/supabase/groups', async (original) => ({
  ...(await original<typeof import('./data/supabase/groups')>()),
  listMyGroups: vi.fn(),
  createGroup: vi.fn(),
  createInvite: vi.fn(),
  previewInvite: vi.fn(),
  acceptInvite: vi.fn(),
}))
vi.mock('./data/supabase/shiftsAdmin', async (original) => ({
  ...(await original<typeof import('./data/supabase/shiftsAdmin')>()),
  assignShift: vi.fn(),
  deleteShift: vi.fn(),
}))
vi.mock('./data/supabase/supabaseSource', () => ({ createSupabaseSource: vi.fn() }))

const client = {} as SupabaseClient
const NOW = new Date('2026-10-20T12:00:00Z')
const groupA = { id: 'g1', name: 'Reparto', role: 'manager' as const }

beforeEach(() => {
  window.location.hash = ''
  localStorage.clear()
  vi.mocked(profileExists).mockResolvedValue(true)
  vi.mocked(listMyGroups).mockResolvedValue([groupA])
  vi.mocked(createSupabaseSource).mockReturnValue(makeSource())
})
afterEach(() => {
  cleanup()
  vi.resetAllMocks()
})

function show(onSignOut = vi.fn()) {
  renderWithI18n(<AccountApp client={client} userId="u1" now={NOW} onSignOut={onSignOut} />)
  return onSignOut
}

test('asks for a name when the user has no profile, saves it, then shows the groups', async () => {
  vi.mocked(profileExists).mockResolvedValueOnce(false).mockResolvedValue(true)
  vi.mocked(saveProfile).mockResolvedValue(undefined)
  show()
  fireEvent.change(await screen.findByLabelText('Nome visualizzato'), { target: { value: 'Luca' } })
  fireEvent.click(screen.getByRole('button', { name: 'Continua' }))
  await waitFor(() => expect(saveProfile).toHaveBeenCalledWith(client, 'u1', 'Luca'))
  expect(await screen.findByRole('heading', { name: 'I tuoi gruppi' })).toBeInTheDocument()
})

test('opens a group into the existing pages, with a source built for that group and user', async () => {
  show()
  fireEvent.click(await screen.findByRole('button', { name: 'Reparto' }))
  expect(await screen.findByRole('navigation')).toBeInTheDocument()
  expect(createSupabaseSource).toHaveBeenCalledWith(client, 'g1', 'u1')
})

test('Cambia gruppo in the settings goes back to the list', async () => {
  show()
  fireEvent.click(await screen.findByRole('button', { name: 'Reparto' }))
  window.location.hash = '#/settings'
  // The button also shows while loading; wait for the loaded page so the click is not on a copy about to be replaced.
  await screen.findByRole('heading', { name: 'Impostazioni' })
  fireEvent.click(screen.getByRole('button', { name: 'Cambia gruppo' }))
  expect(await screen.findByRole('heading', { name: 'I tuoi gruppi' })).toBeInTheDocument()
})

test('a group that was just created is opened straight away', async () => {
  vi.mocked(listMyGroups).mockResolvedValue([])
  vi.mocked(createGroup).mockResolvedValue('g9')
  show()
  fireEvent.change(await screen.findByLabelText('Nome del nuovo gruppo'), { target: { value: 'Nuovo' } })
  fireEvent.click(screen.getByRole('button', { name: 'Crea gruppo' }))
  await waitFor(() => expect(createGroup).toHaveBeenCalledWith(client, 'Nuovo'))
  await waitFor(() => expect(createSupabaseSource).toHaveBeenCalledWith(client, 'g9', 'u1'))
})

test('the invite link points under the app base path, with the code in the hash', async () => {
  vi.mocked(createInvite).mockResolvedValue('abc')
  show()
  fireEvent.click(await screen.findByRole('button', { name: /Crea link d’invito/ }))
  expect(await screen.findByLabelText(/Link d’invito/)).toHaveValue(
    `${window.location.origin}${import.meta.env.BASE_URL}#/invite/abc`,
  )
  expect(createInvite).toHaveBeenCalledWith(client, 'g1')
})

test('a code kept from before the sign-in is previewed first, then accepted into that group', async () => {
  rememberInvite('abc')
  vi.mocked(previewInvite).mockResolvedValue({ groupName: 'Altro', memberCount: 2 })
  vi.mocked(acceptInvite).mockResolvedValue('g2')
  show()
  expect(await screen.findByText('Altro')).toBeInTheDocument()
  expect(previewInvite).toHaveBeenCalledWith(client, 'abc')
  fireEvent.click(screen.getByRole('button', { name: 'Accetta' }))
  await waitFor(() => expect(acceptInvite).toHaveBeenCalledWith(client, 'abc'))
  await waitFor(() => expect(createSupabaseSource).toHaveBeenCalledWith(client, 'g2', 'u1'))
  expect(readPendingInvite()).toBeNull()
})

test('the code in the address is used when nothing was stored', async () => {
  window.location.hash = '#/invite/xyz'
  vi.mocked(previewInvite).mockResolvedValue({ groupName: 'Altro', memberCount: 2 })
  show()
  await screen.findByText('Altro')
  expect(previewInvite).toHaveBeenCalledWith(client, 'xyz')
})

test('declining forgets the code and returns to the groups', async () => {
  rememberInvite('abc')
  vi.mocked(previewInvite).mockResolvedValue({ groupName: 'Altro', memberCount: 2 })
  show()
  fireEvent.click(await screen.findByRole('button', { name: 'Rifiuta' }))
  expect(await screen.findByRole('heading', { name: 'I tuoi gruppi' })).toBeInTheDocument()
  expect(readPendingInvite()).toBeNull()
  expect(window.location.hash).toBe('#/')
})

test('an invalid invite is explained, and going back clears it too', async () => {
  rememberInvite('abc')
  vi.mocked(previewInvite).mockResolvedValue(null)
  show()
  expect(await screen.findByRole('alert')).toHaveTextContent('Questo invito non è valido')
  fireEvent.click(screen.getByRole('button', { name: 'Torna ai gruppi' }))
  expect(await screen.findByRole('heading', { name: 'I tuoi gruppi' })).toBeInTheDocument()
  expect(readPendingInvite()).toBeNull()
})

test('Esci calls onSignOut', async () => {
  const onSignOut = show()
  fireEvent.click(await screen.findByRole('button', { name: 'Esci' }))
  expect(onSignOut).toHaveBeenCalledOnce()
})

test('a failed groups load can be retried', async () => {
  vi.mocked(listMyGroups).mockRejectedValueOnce(new Error('network')).mockResolvedValue([groupA])
  show()
  fireEvent.click(await screen.findByRole('button', { name: 'Riprova' }))
  expect(await screen.findByRole('button', { name: 'Reparto' })).toBeInTheDocument()
})

test('the manager of the group gets Gestione and assigns a shift for that group', async () => {
  vi.mocked(assignShift).mockResolvedValue(undefined)
  show()
  fireEvent.click(await screen.findByRole('button', { name: 'Reparto' }))
  expect(await screen.findByRole('link', { name: 'Gestione' })).toBeInTheDocument()
  window.location.hash = '#/manage'
  fireEvent.change(await screen.findByLabelText('Data'), { target: { value: '2026-10-24' } })
  fireEvent.click(screen.getByRole('button', { name: 'Assegna turno' }))
  await waitFor(() =>
    expect(assignShift).toHaveBeenCalledWith(
      client,
      'g1',
      expect.objectContaining({ userId: 'me', code: 'M', startsAt: '2026-10-24T04:00:00.000Z' }),
    ),
  )
})

test('a plain member has no Gestione link, and the page tells them why if they open it', async () => {
  vi.mocked(listMyGroups).mockResolvedValue([{ ...groupA, role: 'member' }])
  show()
  fireEvent.click(await screen.findByRole('button', { name: 'Reparto' }))
  await screen.findByRole('navigation')
  expect(screen.queryByRole('link', { name: 'Gestione' })).not.toBeInTheDocument()
  window.location.hash = '#/manage'
  expect(await screen.findByText(/Solo il responsabile/)).toBeInTheDocument()
  expect(assignShift).not.toHaveBeenCalled()
})
