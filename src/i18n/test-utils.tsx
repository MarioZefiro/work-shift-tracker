import { render } from '@testing-library/react'
import type { ReactElement, ReactNode } from 'react'
import { I18nProvider } from './I18nProvider'
import type { Locale } from './locales'

// jsdom reports en-US, so tests pin the locale explicitly (default Italian).
// A wrapper (not a manual wrap) keeps `rerender` inside the provider.
export function renderWithI18n(ui: ReactElement, { locale = 'it' }: { locale?: Locale } = {}) {
  const wrapper = ({ children }: { children: ReactNode }) => <I18nProvider initialLocale={locale}>{children}</I18nProvider>
  return render(ui, { wrapper })
}
