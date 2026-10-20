import { render, screen } from '@testing-library/react'
import { afterEach, expect, test, vi } from 'vitest'
import { ErrorBoundary } from './ErrorBoundary'

function Boom(): never {
  throw new Error('boom')
}

afterEach(() => vi.restoreAllMocks())

test('shows the fallback when a child throws', () => {
  vi.spyOn(console, 'error').mockImplementation(() => {}) // React logs caught render errors
  render(
    <ErrorBoundary>
      <Boom />
    </ErrorBoundary>,
  )
  expect(screen.getByRole('alert')).toHaveTextContent('Qualcosa è andato storto')
})

test('renders children when nothing throws', () => {
  render(
    <ErrorBoundary>
      <p>ok</p>
    </ErrorBoundary>,
  )
  expect(screen.getByText('ok')).toBeInTheDocument()
})
