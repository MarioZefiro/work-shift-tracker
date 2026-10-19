import { cleanup, render, renderHook, screen } from '@testing-library/react'
import { afterEach, expect, test } from 'vitest'
import { AppShell } from './AppShell'
import { useRoute } from './useRoute'

afterEach(() => {
  cleanup()
  window.location.hash = ''
})

test('shows the five navigation links', () => {
  render(<AppShell route="home">x</AppShell>)
  const nav = screen.getByRole('navigation', { name: 'Principale' })
  for (const name of ['Home', 'Persone', 'Profilo', 'Impostazioni', 'FAQ']) {
    expect(nav).toContainElement(screen.getByRole('link', { name }))
  }
})

test('marks the current page with aria-current', () => {
  render(<AppShell route="persone">x</AppShell>)
  expect(screen.getByRole('link', { name: 'Persone' })).toHaveAttribute('aria-current', 'page')
  expect(screen.getByRole('link', { name: 'Home' })).not.toHaveAttribute('aria-current')
})

test('has a skip link to the main content', () => {
  render(<AppShell route="home">x</AppShell>)
  expect(screen.getByRole('link', { name: 'Vai al contenuto' })).toHaveAttribute('href', '#contenuto')
})

test('useRoute falls back to home for an unknown hash', () => {
  window.location.hash = '#/boh'
  expect(renderHook(() => useRoute()).result.current).toBe('home')
  window.location.hash = '#/faq'
  expect(renderHook(() => useRoute()).result.current).toBe('faq')
})

test('moves focus to the main region when the route changes', () => {
  const { rerender } = render(<AppShell route="home">x</AppShell>)
  const main = screen.getByRole('main')
  expect(main).not.toHaveFocus()
  rerender(<AppShell route="faq">x</AppShell>)
  expect(main).toHaveFocus()
})
