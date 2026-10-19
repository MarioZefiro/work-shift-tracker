import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, expect, test } from 'vitest'
import App from './App'

afterEach(cleanup)
beforeEach(() => {
  window.location.hash = ''
})

test('shows the landing page first', () => {
  render(<App />)
  expect(screen.getByRole('button', { name: 'Prova la demo' })).toBeInTheDocument()
})

test('clicking Prova la demo opens the home page', async () => {
  render(<App />)
  fireEvent.click(screen.getByRole('button', { name: 'Prova la demo' }))
  expect(await screen.findByRole('heading', { level: 1 })).toBeInTheDocument()
  expect(screen.queryByRole('button', { name: 'Prova la demo' })).not.toBeInTheDocument()
})

test('Esci dalla demo returns to the landing page', async () => {
  render(<App />)
  fireEvent.click(screen.getByRole('button', { name: 'Prova la demo' }))
  window.location.hash = '#/impostazioni'
  fireEvent.click(await screen.findByRole('button', { name: 'Esci dalla demo' }))
  expect(screen.getByRole('button', { name: 'Prova la demo' })).toBeInTheDocument()
})
