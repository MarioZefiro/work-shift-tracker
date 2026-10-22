import { fireEvent, screen, waitFor } from '@testing-library/react'
import { expect, test, vi } from 'vitest'
import { renderWithI18n } from '../i18n/test-utils'
import { GroupsPage } from './GroupsPage'

const groups = [
  { id: 'g1', name: 'Reparto', role: 'manager' as const },
  { id: 'g2', name: 'Altro', role: 'member' as const },
]

function setup(overrides: Partial<Parameters<typeof GroupsPage>[0]> = {}) {
  const props = {
    groups,
    onOpen: vi.fn(),
    onCreate: vi.fn().mockResolvedValue(undefined),
    onInvite: vi.fn().mockResolvedValue('https://example.test/#/invite/abc'),
    onSignOut: vi.fn(),
    ...overrides,
  }
  renderWithI18n(<GroupsPage {...props} />)
  return props
}

test('lists the groups with the role of the user in each, and opens one', () => {
  const props = setup()
  expect(screen.getByRole('heading', { level: 1, name: 'I tuoi gruppi' })).toBeInTheDocument()
  expect(screen.getByText('Responsabile')).toBeInTheDocument()
  expect(screen.getByText('Membro')).toBeInTheDocument()
  fireEvent.click(screen.getByRole('button', { name: 'Altro' }))
  expect(props.onOpen).toHaveBeenCalledWith('g2')
})

test('says so when the user is in no group yet', () => {
  setup({ groups: [] })
  expect(screen.getByText(/Non fai ancora parte di nessun gruppo/)).toBeInTheDocument()
})

test('creates a group with the typed name', async () => {
  const props = setup()
  fireEvent.change(screen.getByLabelText('Nome del nuovo gruppo'), { target: { value: 'Nuovo' } })
  fireEvent.click(screen.getByRole('button', { name: 'Crea gruppo' }))
  await waitFor(() => expect(props.onCreate).toHaveBeenCalledWith('Nuovo'))
})

test('shows an alert when the group cannot be created', async () => {
  setup({ onCreate: () => Promise.reject(new Error('x')) })
  fireEvent.change(screen.getByLabelText('Nome del nuovo gruppo'), { target: { value: 'Nuovo' } })
  fireEvent.click(screen.getByRole('button', { name: 'Crea gruppo' }))
  expect(await screen.findByRole('alert')).toHaveTextContent('Non sono riuscito a creare il gruppo')
})

test('only a manager can create an invite link, and it is shown to copy', async () => {
  const props = setup()
  expect(screen.getAllByRole('button', { name: /Crea link d’invito/ })).toHaveLength(1)
  fireEvent.click(screen.getByRole('button', { name: /Crea link d’invito/ }))
  const field = await screen.findByLabelText(/Link d’invito/)
  expect(props.onInvite).toHaveBeenCalledWith('g1')
  expect(field).toHaveValue('https://example.test/#/invite/abc')
  expect(field).toHaveAttribute('readonly')
})

test('shows an alert when the invite cannot be created', async () => {
  setup({ onInvite: () => Promise.reject(new Error('x')) })
  fireEvent.click(screen.getByRole('button', { name: /Crea link d’invito/ }))
  expect(await screen.findByRole('alert')).toHaveTextContent('Non sono riuscito a creare l’invito')
})

test('Esci signs out', () => {
  const props = setup()
  fireEvent.click(screen.getByRole('button', { name: 'Esci' }))
  expect(props.onSignOut).toHaveBeenCalledOnce()
})
