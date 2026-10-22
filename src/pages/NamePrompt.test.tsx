import { fireEvent, screen, waitFor } from '@testing-library/react'
import { expect, test, vi } from 'vitest'
import { renderWithI18n } from '../i18n/test-utils'
import { NamePrompt } from './NamePrompt'

test('sends the name without surrounding spaces', async () => {
  const onSubmit = vi.fn().mockResolvedValue(undefined)
  renderWithI18n(<NamePrompt onSubmit={onSubmit} />)
  fireEvent.change(screen.getByLabelText('Nome visualizzato'), { target: { value: '  Luca  ' } })
  fireEvent.click(screen.getByRole('button', { name: 'Continua' }))
  await waitFor(() => expect(onSubmit).toHaveBeenCalledWith('Luca'))
})

test('does not send a name made only of spaces', () => {
  const onSubmit = vi.fn().mockResolvedValue(undefined)
  renderWithI18n(<NamePrompt onSubmit={onSubmit} />)
  fireEvent.change(screen.getByLabelText('Nome visualizzato'), { target: { value: '   ' } })
  fireEvent.click(screen.getByRole('button', { name: 'Continua' }))
  expect(onSubmit).not.toHaveBeenCalled()
})

test('tells colleagues will see the name, not the email', () => {
  renderWithI18n(<NamePrompt onSubmit={() => Promise.resolve()} />)
  expect(screen.getByText(/non la tua email/)).toBeInTheDocument()
})

test('shows an alert when saving fails', async () => {
  renderWithI18n(<NamePrompt onSubmit={() => Promise.reject(new Error('x'))} />)
  fireEvent.change(screen.getByLabelText('Nome visualizzato'), { target: { value: 'Luca' } })
  fireEvent.click(screen.getByRole('button', { name: 'Continua' }))
  expect(await screen.findByRole('alert')).toHaveTextContent('Non sono riuscito a salvare il nome')
})
