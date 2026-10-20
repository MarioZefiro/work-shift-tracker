import { afterEach, expect, test, vi } from 'vitest'
import { clearPendingInvite, readPendingInvite, rememberInvite } from './pendingInvite'

afterEach(() => {
  localStorage.clear()
  vi.restoreAllMocks()
})

test('remembers an invite code until it is cleared', () => {
  expect(readPendingInvite()).toBeNull()
  rememberInvite('abc')
  expect(readPendingInvite()).toBe('abc')
  clearPendingInvite()
  expect(readPendingInvite()).toBeNull()
})

test('does not throw when storage is blocked', () => {
  vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
    throw new Error('blocked')
  })
  vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
    throw new Error('blocked')
  })
  expect(() => rememberInvite('abc')).not.toThrow()
  expect(readPendingInvite()).toBeNull()
})
