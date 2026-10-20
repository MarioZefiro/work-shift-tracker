import { de } from './messages/de'
import { en } from './messages/en'
import { es } from './messages/es'
import { fr } from './messages/fr'
import { it, type Messages } from './messages/it'

// Adding a language: one messages file plus one entry here.
export const LOCALES = [
  { code: 'it', name: 'Italiano', messages: it as Messages },
  { code: 'en', name: 'English', messages: en },
  { code: 'fr', name: 'Français', messages: fr },
  { code: 'es', name: 'Español', messages: es },
  { code: 'de', name: 'Deutsch', messages: de },
] as const

export type Locale = (typeof LOCALES)[number]['code']
export const DEFAULT_LOCALE: Locale = 'it'
const STORAGE_KEY = 'locale'

export const isLocale = (v: unknown): v is Locale => LOCALES.some((l) => l.code === v)

export function readStoredLocale(): Locale | null {
  try {
    const v = window.localStorage.getItem(STORAGE_KEY)
    return isLocale(v) ? v : null
  } catch {
    return null // storage can throw (privacy mode, disabled cookies)
  }
}

export function storeLocale(locale: Locale): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, locale)
  } catch {
    // The choice just won't persist.
  }
}

export function resolveLocale(): Locale {
  const stored = readStoredLocale()
  if (stored) return stored
  for (const tag of navigator.languages ?? []) {
    const primary = tag.toLowerCase().split('-')[0]
    if (isLocale(primary)) return primary
  }
  return DEFAULT_LOCALE
}
