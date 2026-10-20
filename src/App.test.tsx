import { cleanup, fireEvent, screen } from '@testing-library/react'
import type { SupabaseClient } from '@supabase/supabase-js'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import App from './App'
import { renderWithI18n } from './i18n/test-utils'

afterEach(() => {
  cleanup()
  localStorage.clear()
})
beforeEach(() => {
  window.location.hash = ''
})

test('shows the landing page first', () => {
  renderWithI18n(<App client={null} />)
  expect(screen.getByRole('button', { name: 'Prova la demo' })).toBeInTheDocument()
})

test('clicking Prova la demo opens the home page', async () => {
  renderWithI18n(<App client={null} />)
  fireEvent.click(screen.getByRole('button', { name: 'Prova la demo' }))
  expect(await screen.findByRole('heading', { level: 1 })).toBeInTheDocument()
  expect(screen.queryByRole('button', { name: 'Prova la demo' })).not.toBeInTheDocument()
})

test('Esci dalla demo returns to the landing page', async () => {
  renderWithI18n(<App client={null} />)
  fireEvent.click(screen.getByRole('button', { name: 'Prova la demo' }))
  window.location.hash = '#/settings'
  await screen.findByRole('heading', { name: 'Impostazioni' })
  fireEvent.click(await screen.findByRole('button', { name: 'Esci dalla demo' }))
  expect(screen.getByRole('button', { name: 'Prova la demo' })).toBeInTheDocument()
})

test('leaving the demo resets the hash and focuses the landing heading', async () => {
  renderWithI18n(<App client={null} />)
  fireEvent.click(screen.getByRole('button', { name: 'Prova la demo' }))
  window.location.hash = '#/settings'
  await screen.findByRole('heading', { name: 'Impostazioni' })
  fireEvent.click(await screen.findByRole('button', { name: 'Esci dalla demo' }))
  expect(window.location.hash).toBe('#/')
  expect(screen.getByRole('heading', { level: 1 })).toHaveFocus()
})

test('starting the demo focuses the main region', async () => {
  renderWithI18n(<App client={null} />)
  fireEvent.click(screen.getByRole('button', { name: 'Prova la demo' }))
  expect(screen.getByRole('main')).toHaveFocus()
})

test('without a Supabase client there is no sign-in button, only the demo', () => {
  renderWithI18n(<App client={null} />)
  expect(screen.queryByRole('button', { name: 'Accedi' })).not.toBeInTheDocument()
})

// Signed-out client: the session listener reports no session straight away.
function signedOutClient() {
  const signInWithOtp = vi.fn().mockResolvedValue({ error: null })
  const client = {
    auth: {
      onAuthStateChange: (cb: (event: string, session: null) => void) => {
        cb('INITIAL_SESSION', null)
        return { data: { subscription: { unsubscribe: vi.fn() } } }
      },
      signInWithOtp,
    },
  } as unknown as SupabaseClient
  return { client, signInWithOtp }
}

test('with a Supabase client the landing offers Accedi, which opens the email form', async () => {
  const { client, signInWithOtp } = signedOutClient()
  renderWithI18n(<App client={client} />)
  fireEvent.click(await screen.findByRole('button', { name: 'Accedi' }))
  fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'luca@example.test' } })
  fireEvent.click(screen.getByRole('button', { name: 'Inviami il link' }))
  await screen.findByText(/Controlla la tua email/)
  expect(signInWithOtp).toHaveBeenCalledOnce()
})

test('an invite link opened while signed out remembers the code and goes straight to the email form', async () => {
  window.location.hash = '#/invite/abc123'
  const { client } = signedOutClient()
  renderWithI18n(<App client={client} />)
  expect(await screen.findByLabelText('Email')).toBeInTheDocument()
  expect(localStorage.getItem('pendingInvite')).toBe('abc123')
})
