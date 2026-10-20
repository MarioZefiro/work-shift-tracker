import { cleanup, fireEvent, screen } from '@testing-library/react'
import { afterEach, expect, test, vi } from 'vitest'
import { GroupFullError, InvalidInviteError } from '../data/supabase/groups'
import { renderWithI18n } from '../i18n/test-utils'
import { InvitePage } from './InvitePage'

afterEach(cleanup)

const info = { groupName: 'Reparto', memberCount: 3 }

test('shows the group name and the member count, and nothing else about the group', async () => {
  renderWithI18n(<InvitePage load={() => Promise.resolve(info)} onAccept={vi.fn()} onDecline={vi.fn()} />)
  expect(await screen.findByText('Reparto')).toBeInTheDocument()
  expect(screen.getByText('3 membri')).toBeInTheDocument()
})

test('Accetta calls onAccept', async () => {
  const onAccept = vi.fn().mockResolvedValue(undefined)
  renderWithI18n(<InvitePage load={() => Promise.resolve(info)} onAccept={onAccept} onDecline={vi.fn()} />)
  fireEvent.click(await screen.findByRole('button', { name: 'Accetta' }))
  expect(onAccept).toHaveBeenCalledOnce()
})

test('Rifiuta calls onDecline', async () => {
  const onDecline = vi.fn()
  renderWithI18n(<InvitePage load={() => Promise.resolve(info)} onAccept={vi.fn()} onDecline={onDecline} />)
  fireEvent.click(await screen.findByRole('button', { name: 'Rifiuta' }))
  expect(onDecline).toHaveBeenCalledOnce()
})

test('both buttons are disabled while the invite is being accepted, so it is not sent twice', async () => {
  let finish: () => void = () => {}
  renderWithI18n(
    <InvitePage load={() => Promise.resolve(info)} onAccept={() => new Promise<void>((r) => (finish = r))} onDecline={vi.fn()} />,
  )
  fireEvent.click(await screen.findByRole('button', { name: 'Accetta' }))
  expect(screen.getByRole('button', { name: 'Accetta' })).toBeDisabled()
  expect(screen.getByRole('button', { name: 'Rifiuta' })).toBeDisabled()
  finish()
})

test('an invalid invite gets one generic message and a way back', async () => {
  const onDecline = vi.fn()
  renderWithI18n(<InvitePage load={() => Promise.resolve(null)} onAccept={vi.fn()} onDecline={onDecline} />)
  expect(await screen.findByRole('alert')).toHaveTextContent('Questo invito non è valido o è scaduto')
  fireEvent.click(screen.getByRole('button', { name: 'Torna ai gruppi' }))
  expect(onDecline).toHaveBeenCalledOnce()
})

test('accepting can fail because the invite became invalid, the group is full, or something else', async () => {
  for (const [error, text] of [
    [new InvalidInviteError('x'), 'Questo invito non è valido o è scaduto'],
    [new GroupFullError('x'), 'Il gruppo è al completo'],
    [new Error('network'), 'Non riesco a completare l’operazione'],
  ] as const) {
    cleanup()
    renderWithI18n(<InvitePage load={() => Promise.resolve(info)} onAccept={() => Promise.reject(error)} onDecline={vi.fn()} />)
    fireEvent.click(await screen.findByRole('button', { name: 'Accetta' }))
    expect(await screen.findByRole('alert')).toHaveTextContent(text)
  }
})

test('a failed preview offers a retry', async () => {
  const load = vi.fn().mockRejectedValueOnce(new Error('network')).mockResolvedValueOnce(info)
  renderWithI18n(<InvitePage load={load} onAccept={vi.fn()} onDecline={vi.fn()} />)
  fireEvent.click(await screen.findByRole('button', { name: 'Riprova' }))
  expect(await screen.findByText('Reparto')).toBeInTheDocument()
})
