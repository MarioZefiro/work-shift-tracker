import { cleanup, renderHook, screen } from '@testing-library/react'
import { StrictMode } from 'react'
import { afterEach, expect, test } from 'vitest'
import { AppShell } from './AppShell'
import { useRoute } from './useRoute'
import { renderWithI18n } from '../i18n/test-utils'

afterEach(() => {
  cleanup()
  window.location.hash = ''
})

test('shows the five navigation links', () => {
  renderWithI18n(<AppShell route="home">x</AppShell>)
  const nav = screen.getByRole('navigation', { name: 'Principale' })
  for (const name of ['Home', 'Persone', 'Profilo', 'Impostazioni', 'FAQ']) {
    expect(nav).toContainElement(screen.getByRole('link', { name }))
  }
})

test('marks the current page with aria-current', () => {
  renderWithI18n(<AppShell route="persone">x</AppShell>)
  expect(screen.getByRole('link', { name: 'Persone' })).toHaveAttribute('aria-current', 'page')
  expect(screen.getByRole('link', { name: 'Home' })).not.toHaveAttribute('aria-current')
})

test('has a skip link to the main content', () => {
  renderWithI18n(<AppShell route="home">x</AppShell>)
  expect(screen.getByRole('link', { name: 'Vai al contenuto' })).toHaveAttribute('href', '#contenuto')
})

test('useRoute falls back to home for an unknown hash', () => {
  window.location.hash = '#/boh'
  expect(renderHook(() => useRoute()).result.current).toBe('home')
  window.location.hash = '#/faq'
  expect(renderHook(() => useRoute()).result.current).toBe('faq')
})

test('moves focus to the main region when the route changes', () => {
  const { rerender } = renderWithI18n(<AppShell route="home">x</AppShell>)
  const main = screen.getByRole('main')
  expect(main).not.toHaveFocus()
  rerender(<AppShell route="faq">x</AppShell>)
  expect(main).toHaveFocus()
})

test('focuses main on mount only when asked, and survives StrictMode', () => {
  renderWithI18n(
    <StrictMode>
      <AppShell route="home">x</AppShell>
    </StrictMode>,
  )
  expect(screen.getByRole('main')).not.toHaveFocus()
  cleanup()
  renderWithI18n(
    <StrictMode>
      <AppShell route="home" focusOnMount>
        x
      </AppShell>
    </StrictMode>,
  )
  expect(screen.getByRole('main')).toHaveFocus()
})
