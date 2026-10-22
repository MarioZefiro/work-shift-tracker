import { fireEvent, screen } from '@testing-library/react'
import { expect, test, vi } from 'vitest'
import { LandingPage } from './LandingPage'
import { renderWithI18n } from '../i18n/test-utils'

test('LandingPage shows the demo notice and the start button', () => {
  const onStart = vi.fn()
  renderWithI18n(<LandingPage onStart={onStart} />)
  expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument()
  expect(screen.getByText('Progetto dimostrativo: non usare dati reali sensibili')).toBeInTheDocument()
  fireEvent.click(screen.getByRole('button', { name: 'Prova la demo' }))
  expect(onStart).toHaveBeenCalledOnce()
})

test('LandingPage offers sign-in only when it is given a handler', () => {
  const onLogin = vi.fn()
  const { unmount } = renderWithI18n(<LandingPage onStart={vi.fn()} />)
  expect(screen.queryByRole('button', { name: 'Accedi' })).not.toBeInTheDocument()
  unmount()
  renderWithI18n(<LandingPage onStart={vi.fn()} onLogin={onLogin} />)
  fireEvent.click(screen.getByRole('button', { name: 'Accedi' }))
  expect(onLogin).toHaveBeenCalledOnce()
})
