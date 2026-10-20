import { expect, test } from 'vitest'
import { createSupabaseClient } from './client'

test('names VITE_SUPABASE_URL when the url is missing', () => {
  expect(() => createSupabaseClient({ url: undefined, key: 'x' })).toThrow(/VITE_SUPABASE_URL/)
})

test('names VITE_SUPABASE_PUBLISHABLE_KEY when the key is missing', () => {
  expect(() => createSupabaseClient({ url: 'http://127.0.0.1:54321', key: undefined })).toThrow(
    /VITE_SUPABASE_PUBLISHABLE_KEY/,
  )
})

test('treats an empty string like a missing value', () => {
  expect(() => createSupabaseClient({ url: '', key: 'x' })).toThrow(/VITE_SUPABASE_URL/)
})

test('returns a client when both values are present', () => {
  const client = createSupabaseClient({ url: 'http://127.0.0.1:54321', key: 'sb_publishable_test' })
  expect(typeof client.auth.signInWithOtp).toBe('function')
})
