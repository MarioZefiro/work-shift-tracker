import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { useNow } from './useNow'

beforeEach(() => {
  vi.useFakeTimers()
  vi.setSystemTime(new Date('2026-10-20T21:59:00Z')) // 23:59 Rome
})
afterEach(() => vi.useRealTimers())

it('keeps the same Date within a day and renews it after midnight', () => {
  const { result } = renderHook(() => useNow('Europe/Rome'))
  const first = result.current
  act(() => vi.advanceTimersByTime(30_000))
  expect(result.current).toBe(first)
  act(() => vi.advanceTimersByTime(30_000))
  expect(result.current).not.toBe(first)
  expect(result.current.toISOString()).toBe('2026-10-20T22:00:00.000Z')
})
