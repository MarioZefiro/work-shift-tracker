import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import { I18nProvider } from './I18nProvider'
import { LanguageSelect } from './LanguageSelect'
import { LOCALES, resolveLocale } from './locales'
import { it } from './messages/it'
import { MiniMonth } from '../pages/MiniMonth'
import { renderWithI18n } from './test-utils'
import { createTranslate } from './translate'
import { useI18n } from './I18nContext'

afterEach(() => {
  vi.restoreAllMocks()
  window.localStorage.clear()
})
beforeEach(() => window.localStorage.clear())

const placeholders = (v: unknown) =>
  [...JSON.stringify(v).matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort().join(',')

test.each(LOCALES.map((l) => l.code))('%s has the same keys as it, no empty strings, same placeholders', (code) => {
  const messages = LOCALES.find((l) => l.code === code)!.messages as Record<string, unknown>
  expect(Object.keys(messages).sort()).toEqual(Object.keys(it).sort())
  for (const [key, value] of Object.entries(messages)) {
    const strings = typeof value === 'string' ? [value] : Object.values(value as object)
    for (const s of strings) expect(s.trim(), key).not.toBe('')
    expect(placeholders(value), key).toBe(placeholders((it as Record<string, unknown>)[key]))
  }
})

test('a stored choice wins over the browser languages', () => {
  vi.spyOn(navigator, 'languages', 'get').mockReturnValue(['fr-CA'])
  window.localStorage.setItem('locale', 'es')
  expect(resolveLocale()).toBe('es')
})

test('falls back to the first supported browser language by primary subtag', () => {
  vi.spyOn(navigator, 'languages', 'get').mockReturnValue(['pt', 'fr-CA', 'en'])
  expect(resolveLocale()).toBe('fr')
})

test('falls back to Italian for unsupported languages', () => {
  vi.spyOn(navigator, 'languages', 'get').mockReturnValue(['pt', 'ja'])
  expect(resolveLocale()).toBe('it')
})

test('still works when storage throws', () => {
  vi.spyOn(navigator, 'languages', 'get').mockReturnValue(['en'])
  vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
    throw new Error('denied')
  })
  vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
    throw new Error('denied')
  })
  render(
    <I18nProvider>
      <LanguageSelect />
    </I18nProvider>,
  )
  expect(screen.getByLabelText('Language')).toHaveValue('en')
  fireEvent.change(screen.getByLabelText('Language'), { target: { value: 'fr' } })
  expect(screen.getByLabelText('Langue')).toHaveValue('fr')
})

function Probe() {
  const { t } = useI18n()
  return <p>{t('nav.skip')}</p>
}

test('switching language changes text, html lang and title', () => {
  renderWithI18n(
    <>
      <LanguageSelect />
      <Probe />
    </>,
  )
  expect(screen.getByText('Vai al contenuto')).toBeInTheDocument()
  expect(document.documentElement.lang).toBe('it')
  fireEvent.change(screen.getByLabelText('Lingua'), { target: { value: 'es' } })
  expect(screen.getByText('Ir al contenido')).toBeInTheDocument()
  expect(document.documentElement.lang).toBe('es')
  expect(document.title).toBe('Turni — turnos de trabajo compartidos')
  expect(window.localStorage.getItem('locale')).toBe('es')
})

test('selector options carry endonym and lang', () => {
  renderWithI18n(<LanguageSelect />)
  const options = screen.getAllByRole('option')
  expect(options.map((o) => [o.textContent, o.getAttribute('lang')])).toEqual([
    ['Italiano', 'it'],
    ['English', 'en'],
    ['Français', 'fr'],
    ['Español', 'es'],
    ['Deutsch', 'de'],
  ])
})

test('plural forms follow the locale', () => {
  const en = createTranslate('en', LOCALES[1].messages)
  expect(en('month.working', { count: 1 })).toBe('1 person on duty')
  expect(en('month.working', { count: 4 })).toBe('4 people on duty')
  const fr = createTranslate('fr', LOCALES[2].messages)
  expect(fr('month.working', { count: 1 })).toBe('1 personne en service')
  expect(fr('month.working', { count: 4 })).toBe('4 personnes en service')
  const it = createTranslate('it', LOCALES[0].messages)
  expect(it('invite.members', { count: 1 })).toBe('1 membro')
  expect(it('invite.members', { count: 3 })).toBe('3 membri')
})

test('mini month labels pluralise per locale and flag days without data', () => {
  const props = { today: '2026-10-19', counts: { '2026-10-19': 1, '2026-10-20': 4 }, hasData: new Set(['2026-10-19', '2026-10-20']), mine: { '2026-10-20': 'P' as const }, selected: null, onSelect: () => {} }
  renderWithI18n(<MiniMonth {...props} />, { locale: 'en' })
  expect(screen.getByRole('button', { name: 'October 19, 1 person on duty' })).toBeInTheDocument()
  expect(screen.getByRole('button', { name: 'October 20, 4 people on duty, your shift: Afternoon' })).toBeInTheDocument()
  expect(screen.getByLabelText('October 1, no data')).toHaveTextContent('1–')
  cleanup()
  renderWithI18n(<MiniMonth {...props} />, { locale: 'it' })
  expect(screen.getByRole('button', { name: '19 ottobre, 1 in servizio' })).toBeInTheDocument()
  expect(screen.getByLabelText('1 ottobre, nessun dato')).toBeInTheDocument()
})
