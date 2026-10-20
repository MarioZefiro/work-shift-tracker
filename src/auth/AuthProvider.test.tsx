import type { SupabaseClient } from '@supabase/supabase-js'
import { act, cleanup, render, screen } from '@testing-library/react'
import { afterEach, expect, test, vi } from 'vitest'
import { AuthProvider } from './AuthProvider'
import { useAuth } from './AuthContext'

afterEach(() => {
  cleanup()
  window.location.hash = ''
})

type Session = { user: { id: string } } | null

function fakeClient(otpError: Error | null = null) {
  let listener: ((event: string, session: Session) => void) | undefined
  const unsubscribe = vi.fn()
  const signInWithOtp = vi.fn().mockResolvedValue({ error: otpError })
  const signOut = vi.fn().mockResolvedValue({ error: null })
  const client = {
    auth: {
      onAuthStateChange: (cb: typeof listener) => {
        listener = cb
        return { data: { subscription: { unsubscribe } } }
      },
      signInWithOtp,
      signOut,
    },
  } as unknown as SupabaseClient
  const emit = (session: Session) => act(() => listener?.('INITIAL_SESSION', session))
  return { client, emit, signInWithOtp, signOut, unsubscribe }
}

function Probe({ onAuth }: { onAuth?: (auth: ReturnType<typeof useAuth>) => void }) {
  const auth = useAuth()
  onAuth?.(auth)
  return (
    <p>
      {auth.status}:{auth.userId ?? '-'}:{auth.linkError ? 'link-error' : 'ok'}
    </p>
  )
}

test('is loading until the first session event, then follows the session', () => {
  const { client, emit } = fakeClient()
  render(
    <AuthProvider client={client}>
      <Probe />
    </AuthProvider>,
  )
  expect(screen.getByText('loading:-:ok')).toBeInTheDocument()
  emit({ user: { id: 'u1' } })
  expect(screen.getByText('signedIn:u1:ok')).toBeInTheDocument()
  emit(null)
  expect(screen.getByText('signedOut:-:ok')).toBeInTheDocument()
})

test('without a client the user is signed out, so the demo still works', () => {
  render(
    <AuthProvider client={null}>
      <Probe />
    </AuthProvider>,
  )
  expect(screen.getByText('signedOut:-:ok')).toBeInTheDocument()
})

test('signInWithEmail asks for a link that returns to the app base path', async () => {
  const { client, signInWithOtp } = fakeClient()
  let auth: ReturnType<typeof useAuth> | undefined
  render(
    <AuthProvider client={client}>
      <Probe onAuth={(a) => (auth = a)} />
    </AuthProvider>,
  )
  await auth?.signInWithEmail('luca@example.test')
  expect(signInWithOtp).toHaveBeenCalledWith({
    email: 'luca@example.test',
    options: { emailRedirectTo: window.location.origin + import.meta.env.BASE_URL },
  })
})

test('signInWithEmail rejects with the error the client reports', async () => {
  const { client } = fakeClient(new Error('rate limited'))
  let auth: ReturnType<typeof useAuth> | undefined
  render(
    <AuthProvider client={client}>
      <Probe onAuth={(a) => (auth = a)} />
    </AuthProvider>,
  )
  await expect(auth?.signInWithEmail('luca@example.test')).rejects.toThrow('rate limited')
})

test('signInWithEmail without a client says why instead of failing silently', async () => {
  let auth: ReturnType<typeof useAuth> | undefined
  render(
    <AuthProvider client={null}>
      <Probe onAuth={(a) => (auth = a)} />
    </AuthProvider>,
  )
  await expect(auth?.signInWithEmail('luca@example.test')).rejects.toThrow(/not configured/i)
})

test('stops listening when it unmounts', () => {
  const { client, unsubscribe } = fakeClient()
  const { unmount } = render(
    <AuthProvider client={client}>
      <Probe />
    </AuthProvider>,
  )
  unmount()
  expect(unsubscribe).toHaveBeenCalledOnce()
})

test('notices that the sign-in link came back with an error, and can forget it', () => {
  window.location.hash = '#error=access_denied&error_code=otp_expired&error_description=Email+link+is+invalid'
  const { client } = fakeClient()
  let auth: ReturnType<typeof useAuth> | undefined
  render(
    <AuthProvider client={client}>
      <Probe onAuth={(a) => (auth = a)} />
    </AuthProvider>,
  )
  expect(screen.getByText(/link-error/)).toBeInTheDocument()
  act(() => auth?.clearLinkError())
  expect(screen.getByText(/:ok/)).toBeInTheDocument()
  expect(window.location.hash).toBe('')
})
