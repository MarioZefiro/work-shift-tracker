import { render, screen } from '@testing-library/react'
import { expect, test } from 'vitest'
import App from './App'

test('renders the home page by default', () => {
  render(<App />)
  expect(screen.getByRole('heading', { name: 'Home' })).toBeInTheDocument()
})
