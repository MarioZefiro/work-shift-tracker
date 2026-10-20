import { cleanup, fireEvent, screen } from '@testing-library/react'
import { afterEach, beforeEach, expect, test } from 'vitest'
import App from './App'
import { renderWithI18n } from './i18n/test-utils'

afterEach(cleanup)
beforeEach(() => {
  window.location.hash = ''
})

test('shows the landing page first', () => {
  renderWithI18n(<App />)
  expect(screen.getByRole('button', { name: 'Prova la demo' })).toBeInTheDocument()
})

test('clicking Prova la demo opens the home page', async () => {
  renderWithI18n(<App />)
  fireEvent.click(screen.getByRole('button', { name: 'Prova la demo' }))
  expect(await screen.findByRole('heading', { level: 1 })).toBeInTheDocument()
  expect(screen.queryByRole('button', { name: 'Prova la demo' })).not.toBeInTheDocument()
})

test('Esci dalla demo returns to the landing page', async () => {
  renderWithI18n(<App />)
  fireEvent.click(screen.getByRole('button', { name: 'Prova la demo' }))
  window.location.hash = '#/impostazioni'
  fireEvent.click(await screen.findByRole('button', { name: 'Esci dalla demo' }))
  expect(screen.getByRole('button', { name: 'Prova la demo' })).toBeInTheDocument()
})

test('leaving the demo resets the hash and focuses the landing heading', async () => {
  renderWithI18n(<App />)
  fireEvent.click(screen.getByRole('button', { name: 'Prova la demo' }))
  window.location.hash = '#/impostazioni'
  fireEvent.click(await screen.findByRole('button', { name: 'Esci dalla demo' }))
  expect(window.location.hash).toBe('#/')
  expect(screen.getByRole('heading', { level: 1 })).toHaveFocus()
})

test('starting the demo focuses the main region', async () => {
  renderWithI18n(<App />)
  fireEvent.click(screen.getByRole('button', { name: 'Prova la demo' }))
  expect(screen.getByRole('main')).toHaveFocus()
})
