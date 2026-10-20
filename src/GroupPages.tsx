import { AppShell } from './app/AppShell'
import type { Route } from './app/useRoute'
import type { DataSource } from './data/DataSource'
import type { MessageKey } from './i18n/messages/it'
import { FaqPage } from './pages/FaqPage'
import { HomePage } from './pages/HomePage'
import { PeoplePage } from './pages/PeoplePage'
import { ProfilePage } from './pages/ProfilePage'
import { SettingsPage } from './pages/SettingsPage'

// The screens of one group, shared by the demo and the signed-in app: both only differ by the DataSource.
export function GroupPages({
  source,
  now,
  route,
  onLeave,
  leaveKey,
}: {
  source: DataSource
  now: Date
  route: Route
  onLeave: () => void
  leaveKey?: MessageKey
}) {
  // `invite` is not a screen of the group: an invite link opened here falls back to home.
  const page = route === 'invite' ? 'home' : route
  return (
    <AppShell route={page} focusOnMount>
      {page === 'home' && <HomePage source={source} now={now} />}
      {page === 'people' && <PeoplePage source={source} />}
      {page === 'profile' && <ProfilePage source={source} />}
      {page === 'settings' && <SettingsPage source={source} onLeave={onLeave} leaveKey={leaveKey} />}
      {page === 'faq' && <FaqPage />}
    </AppShell>
  )
}
