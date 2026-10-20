import { AppShell } from './app/AppShell'
import type { Route } from './app/useRoute'
import type { DataSource } from './data/DataSource'
import type { Shift } from './lib/types'
import type { MessageKey } from './i18n/messages/it'
import { FaqPage } from './pages/FaqPage'
import { HomePage } from './pages/HomePage'
import { ManagePage } from './pages/ManagePage'
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
  manage,
}: {
  source: DataSource
  now: Date
  route: Route
  onLeave: () => void
  leaveKey?: MessageKey
  // Only the signed-in app manages shifts; in the demo this is absent and the route falls back to home.
  manage?: {
    isManager: boolean
    onAssign: (shift: Shift) => Promise<void>
    onDelete: (shiftId: string) => Promise<void>
    onGenerate: (shifts: Shift[]) => Promise<void>
  }
}) {
  // `invite` is not a screen of the group: an invite link opened here falls back to home.
  const page = route === 'invite' || (route === 'manage' && !manage) ? 'home' : route
  return (
    <AppShell route={page} focusOnMount showManage={manage?.isManager}>
      {page === 'home' && <HomePage source={source} now={now} />}
      {page === 'people' && <PeoplePage source={source} />}
      {page === 'profile' && <ProfilePage source={source} />}
      {page === 'settings' && <SettingsPage source={source} onLeave={onLeave} leaveKey={leaveKey} />}
      {page === 'faq' && <FaqPage />}
      {page === 'manage' && manage && (
        <ManagePage
          source={source}
          now={now}
          isManager={manage.isManager}
          onAssign={manage.onAssign}
          onDelete={manage.onDelete}
          onGenerate={manage.onGenerate}
        />
      )}
    </AppShell>
  )
}
