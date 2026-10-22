import { fireEvent, screen, waitFor } from '@testing-library/react'
import { expect, test, vi } from 'vitest'
import { InvalidInviteError } from '../data/supabase/groups'
import { renderWithI18n } from '../i18n/test-utils'
import { expectNoA11yViolations } from '../test-axe'
import { makeSource } from '../test-utils'
import { GroupsPage } from './GroupsPage'
import { InvitePage } from './InvitePage'
import { LoginPage } from './LoginPage'
import { ManagePage } from './ManagePage'

test('LoginPage: form, error and "check your email" states', async () => {
  const onSubmit = vi.fn().mockRejectedValueOnce(new Error('x')).mockResolvedValueOnce(undefined)
  const { container } = renderWithI18n(<LoginPage onSubmit={onSubmit} />)
  await expectNoA11yViolations(container)
  fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'luca@example.test' } })
  fireEvent.click(screen.getByRole('button', { name: 'Inviami il link' }))
  await screen.findByRole('alert')
  await expectNoA11yViolations(container)
  fireEvent.click(screen.getByRole('button', { name: 'Inviami il link' }))
  await screen.findByRole('heading', { name: 'Controlla la tua email' })
  await expectNoA11yViolations(container)
})

test('ManagePage: manager view and the delete confirmation step', async () => {
  const shifts = vi.fn().mockResolvedValue([
    { id: 's1', userId: 'me', code: 'M', startsAt: '2026-10-21T04:00:00Z', endsAt: '2026-10-21T12:00:00Z' },
  ])
  const { container } = renderWithI18n(
    <ManagePage
      source={makeSource({ shifts })}
      now={new Date('2026-10-20T12:00:00Z')}
      isManager
      onAssign={vi.fn()}
      onDelete={vi.fn()}
      onGenerate={vi.fn()}
    />,
  )
  fireEvent.click(await screen.findByRole('button', { name: /Cancella.*Luca/ }))
  await screen.findByRole('button', { name: /Conferma cancellazione.*Luca/ })
  await expectNoA11yViolations(container)
})

test('GroupsPage: list and invite link', async () => {
  const { container } = renderWithI18n(
    <GroupsPage
      groups={[
        { id: 'g1', name: 'Reparto', role: 'manager' },
        { id: 'g2', name: 'Altro', role: 'member' },
      ]}
      onOpen={vi.fn()}
      onCreate={vi.fn()}
      onInvite={vi.fn().mockResolvedValue('https://example.test/#/invite/abc')}
      onSignOut={vi.fn()}
    />,
  )
  await expectNoA11yViolations(container)
  fireEvent.click(screen.getByRole('button', { name: /Crea link d’invito/ }))
  await screen.findByLabelText(/Link d’invito/)
  await expectNoA11yViolations(container)
})

test('InvitePage: invite, accept error and invalid invite', async () => {
  const info = { groupName: 'Reparto', memberCount: 3 }
  const onAccept = () => Promise.reject(new InvalidInviteError())
  const first = renderWithI18n(<InvitePage load={() => Promise.resolve(info)} onAccept={onAccept} onDecline={vi.fn()} />)
  fireEvent.click(await screen.findByRole('button', { name: 'Accetta' }))
  await screen.findByRole('alert')
  await expectNoA11yViolations(first.container)
  first.unmount()
  const second = renderWithI18n(<InvitePage load={() => Promise.resolve(null)} onAccept={vi.fn()} onDecline={vi.fn()} />)
  await waitFor(() => expect(screen.getByRole('button', { name: /Indietro|Rifiuta|Torna/ })).toBeInTheDocument())
  await expectNoA11yViolations(second.container)
})
