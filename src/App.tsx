import { useState } from 'react'
import { AppShell } from './app/AppShell'
import { useRoute } from './app/useRoute'
import { createDemoSource } from './data/demo'
import { FaqPage } from './pages/FaqPage'
import { HomePage } from './pages/HomePage'
import { LandingPage } from './pages/LandingPage'
import { PeoplePage } from './pages/PeoplePage'
import { ProfilePage } from './pages/ProfilePage'
import { SettingsPage } from './pages/SettingsPage'

export default function App() {
  // Created once: HomePage reloads whenever `now` changes identity.
  const [now] = useState(() => new Date())
  const [source, setSource] = useState<ReturnType<typeof createDemoSource> | null>(null)
  const [left, setLeft] = useState(false)
  const route = useRoute()

  if (!source) return (
      <LandingPage
        focusHeading={left}
        onStart={() => {
          setLeft(false)
          setSource(createDemoSource(now))
        }}
      />
    )

  return (
    <AppShell route={route} focusOnMount>
      {route === 'home' && <HomePage source={source} now={now} />}
      {route === 'persone' && <PeoplePage source={source} />}
      {route === 'profilo' && <ProfilePage source={source} />}
      {route === 'impostazioni' && <SettingsPage source={source} onLeave={() => {
            // Otherwise the next demo would reopen the page the user left from.
            window.location.hash = '#/'
            setLeft(true)
            setSource(null)
          }} />}
      {route === 'faq' && <FaqPage />}
    </AppShell>
  )
}
