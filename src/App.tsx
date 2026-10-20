import { useState } from 'react'
import { AppShell } from './app/AppShell'
import { useNow } from './app/useNow'
import { useRoute } from './app/useRoute'
import type { DataSource } from './data/DataSource'
import { TIME_ZONE, createDemoSource } from './data/demo'
import { FaqPage } from './pages/FaqPage'
import { HomePage } from './pages/HomePage'
import { LandingPage } from './pages/LandingPage'
import { PeoplePage } from './pages/PeoplePage'
import { ProfilePage } from './pages/ProfilePage'
import { SettingsPage } from './pages/SettingsPage'

export default function App() {
  const now = useNow(TIME_ZONE)
  const [source, setSource] = useState<DataSource | null>(null)
  const [left, setLeft] = useState(false)
  const { name: route } = useRoute()

  if (!source)
    return (
      <LandingPage
        focusHeading={left}
        onStart={() => {
          setLeft(false)
          // Source stays fixed after start: demo data covers eight weeks from the start week.
          setSource(createDemoSource(now))
        }}
      />
    )

  return (
    <AppShell route={route} focusOnMount>
      {route === 'home' && <HomePage source={source} now={now} />}
      {route === 'people' && <PeoplePage source={source} />}
      {route === 'profile' && <ProfilePage source={source} />}
      {route === 'settings' && (
        <SettingsPage
          source={source}
          onLeave={() => {
            // Otherwise the next demo would reopen the page the user left from.
            window.location.hash = '#/'
            setLeft(true)
            setSource(null)
          }}
        />
      )}
      {route === 'faq' && <FaqPage />}
    </AppShell>
  )
}
