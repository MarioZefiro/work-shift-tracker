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
  const route = useRoute()

  if (!source) return <LandingPage onStart={() => setSource(createDemoSource(now))} />

  return (
    <AppShell route={route}>
      {route === 'home' && <HomePage source={source} now={now} />}
      {route === 'persone' && <PeoplePage source={source} />}
      {route === 'profilo' && <ProfilePage source={source} />}
      {route === 'impostazioni' && <SettingsPage source={source} onLeave={() => setSource(null)} />}
      {route === 'faq' && <FaqPage />}
    </AppShell>
  )
}
