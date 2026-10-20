import { cleanup, fireEvent, screen, waitFor } from '@testing-library/react'
import { afterEach, expect, test, vi } from 'vitest'
import { renderWithI18n } from '../i18n/test-utils'
import { LoginPage } from './LoginPage'

afterEach(cleanup)

test('asks for the email with a label and sends it', async () => {
  const onSubmit = vi.fn().mockResolvedValue(undefined)
  renderWithI18n(<LoginPage onSubmit={onSubmit} />)
  fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'luca@example.test' } })
  fireEvent.click(screen.getByRole('button', { name: 'Inviami il link' }))
  await waitFor(() => expect(onSubmit).toHaveBeenCalledWith('luca@example.test'))
})

test('tells the user to check the inbox once the link is sent', async () => {
  renderWithI18n(<LoginPage onSubmit={() => Promise.resolve()} />)
  fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'luca@example.test' } })
  fireEvent.click(screen.getByRole('button', { name: 'Inviami il link' }))
  await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('Controlla la tua email'))
})

test('disables the button while sending, so the link is not requested twice', async () => {
  let finish: () => void = () => {}
  const onSubmit = vi.fn(() => new Promise<void>((resolve) => (finish = resolve)))
  renderWithI18n(<LoginPage onSubmit={onSubmit} />)
  fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'luca@example.test' } })
  fireEvent.click(screen.getByRole('button', { name: 'Inviami il link' }))
  expect(await screen.findByRole('button', { name: 'Invio in corso' })).toBeDisabled()
  finish()
  await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('Controlla la tua email'))
})

test('shows an alert when the link cannot be sent, and lets the user retry', async () => {
  const onSubmit = vi.fn().mockRejectedValueOnce(new Error('rate limited')).mockResolvedValueOnce(undefined)
  renderWithI18n(<LoginPage onSubmit={onSubmit} />)
  fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'luca@example.test' } })
  fireEvent.click(screen.getByRole('button', { name: 'Inviami il link' }))
  expect(await screen.findByRole('alert')).toHaveTextContent('Non sono riuscito a inviare il link')
  fireEvent.click(screen.getByRole('button', { name: 'Inviami il link' }))
  await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('Controlla la tua email'))
  expect(screen.queryByRole('alert')).not.toBeInTheDocument()
})

test('offers a way back only when it is given one', () => {
  const onBack = vi.fn()
  const { unmount } = renderWithI18n(<LoginPage onSubmit={vi.fn()} />)
  expect(screen.queryByRole('button', { name: 'Indietro' })).not.toBeInTheDocument()
  unmount()
  renderWithI18n(<LoginPage onSubmit={vi.fn()} onBack={onBack} />)
  fireEvent.click(screen.getByRole('button', { name: 'Indietro' }))
  expect(onBack).toHaveBeenCalledOnce()
})
