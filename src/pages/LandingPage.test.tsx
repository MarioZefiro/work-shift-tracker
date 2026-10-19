import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, expect, test, vi } from 'vitest'
import { LandingPage } from './LandingPage'

afterEach(cleanup)

test('LandingPage shows the demo notice and the start button', () => {
  const onStart = vi.fn()
  render(<LandingPage onStart={onStart} />)
  expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument()
  expect(screen.getByText('Progetto dimostrativo: non usare dati reali sensibili')).toBeInTheDocument()
  fireEvent.click(screen.getByRole('button', { name: 'Prova la demo' }))
  expect(onStart).toHaveBeenCalledOnce()
})
