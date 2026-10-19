import { useEffect, useRef, type ReactNode } from 'react'
import type { Route } from './useRoute'

const LINKS: readonly { route: Route; label: string }[] = [
  { route: 'home', label: 'Home' },
  { route: 'persone', label: 'Persone' },
  { route: 'profilo', label: 'Profilo' },
  { route: 'impostazioni', label: 'Impostazioni' },
  { route: 'faq', label: 'FAQ' },
]

export function AppShell({ route, children }: { route: Route; children: ReactNode }) {
  const mainRef = useRef<HTMLElement>(null)
  const first = useRef(true)

  // Move focus on navigation so keyboard and screen reader users land on the new page;
  // skipped on first render to avoid stealing focus at load.
  useEffect(() => {
    if (first.current) {
      first.current = false
      return
    }
    mainRef.current?.focus()
  }, [route])

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
        Vai al contenuto
      </a>
      <header className="app-header">
        <p className="brand">
          <img src="/favicon.svg" alt="" width="32" height="32" />
          Turni
        </p>
        <nav aria-label="Principale">
          <ul>
            {LINKS.map(({ route: r, label }) => (
              <li key={r}>
                <a href={r === 'home' ? '#/' : `#/${r}`} aria-current={r === route ? 'page' : undefined}>
                  {label}
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
