import { useEffect, useRef, type ReactNode } from 'react'
import { useI18n } from '../i18n/I18nContext'
import type { MessageKey } from '../i18n/messages/it'
import type { Route } from './useRoute'

const LINKS: readonly { route: Route; label: MessageKey }[] = [
  { route: 'home', label: 'nav.home' },
  { route: 'persone', label: 'nav.people' },
  { route: 'profilo', label: 'nav.profile' },
  { route: 'impostazioni', label: 'nav.settings' },
  { route: 'faq', label: 'nav.faq' },
]

export function AppShell({ route, focusOnMount = false, children }: { route: Route; focusOnMount?: boolean; children: ReactNode }) {
  const { t } = useI18n()
  const mainRef = useRef<HTMLElement>(null)
  const shownRoute = useRef<Route | null>(null)

  // Move focus on navigation so keyboard and screen reader users land on the new page.
  // Comparing with the last route (not a "first run" flag) keeps StrictMode's double effect harmless.
  useEffect(() => {
    const changed = shownRoute.current === null ? focusOnMount : shownRoute.current !== route
    shownRoute.current = route
    if (changed) mainRef.current?.focus()
  }, [route, focusOnMount])

  return (
    <>
      <a
        className="skip-link"
        href="#contenuto"
        onClick={(e) => {
          // A real hash change would be read as an unknown route.
          e.preventDefault()
          mainRef.current?.focus()
        }}
      >
        {t('nav.skip')}
      </a>
      <header className="app-header">
        <p className="brand">
          <img src="/favicon.svg" alt="" width="32" height="32" />
          Turni
        </p>
        <nav aria-label={t('nav.label')}>
          <ul>
            {LINKS.map(({ route: r, label }) => (
              <li key={r}>
                <a href={r === 'home' ? '#/' : `#/${r}`} aria-current={r === route ? 'page' : undefined}>
                  {t(label)}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </header>
      <main id="contenuto" tabIndex={-1} ref={mainRef}>
        {children}
      </main>
    </>
  )
}
