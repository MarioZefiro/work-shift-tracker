import type { SupabaseClient } from '@supabase/supabase-js'
import { useCallback, useMemo, useState } from 'react'
import { GroupPages } from './GroupPages'
import { useAsync } from './app/useAsync'
import { useRoute } from './app/useRoute'
import { acceptInvite, createGroup, createInvite, listMyGroups, previewInvite } from './data/supabase/groups'
import { clearPendingInvite, readPendingInvite } from './data/supabase/pendingInvite'
import { profileExists, saveProfile } from './data/supabase/profile'
import { createSupabaseSource } from './data/supabase/supabaseSource'
import { useI18n } from './i18n/I18nContext'
import { GroupsPage } from './pages/GroupsPage'
import { InvitePage } from './pages/InvitePage'
import { LoadState } from './pages/LoadState'
import { NamePrompt } from './pages/NamePrompt'

const inviteUrl = (code: string) => `${window.location.origin}${import.meta.env.BASE_URL}#/invite/${code}`

// What a signed-in user sees: name on first visit, then invite or group list, then the group's screens.
export function AccountApp({
  client,
  userId,
  now,
  onSignOut,
}: {
  client: SupabaseClient
  userId: string
  now: Date
  onSignOut: () => void
}) {
  const { t } = useI18n()
  const { name: route, params } = useRoute()
  const [groupId, setGroupId] = useState<string | null>(null)
  const [pending, setPending] = useState<string | null>(readPendingInvite)
  const profile = useAsync(() => profileExists(client, userId), [client, userId])
  const groups = useAsync(() => listMyGroups(client, userId), [client, userId])

  // The address wins over a code kept from before the sign-in.
  const urlCode = route === 'invite' ? params[0] : undefined
  const code = urlCode ?? pending
  const loadPreview = useCallback(() => (code ? previewInvite(client, code) : Promise.resolve(null)), [client, code])
  const source = useMemo(
    () => (groupId ? createSupabaseSource(client, groupId, userId) : null),
    [client, groupId, userId],
  )

  function finishInvite() {
    clearPendingInvite()
    setPending(null)
    window.location.hash = '#/'
  }

  if (profile.status !== 'ready') {
    return <LoadState failed={profile.status === 'error'} errorMessage={t('error.group')} onRetry={profile.reload} />
  }
  if (!profile.data) {
    return (
      <NamePrompt
        onSubmit={async (name) => {
          await saveProfile(client, userId, name)
          profile.reload()
        }}
      />
    )
  }

  if (code) {
    return (
      <InvitePage
        load={loadPreview}
        onDecline={finishInvite}
        onAccept={async () => {
          const joined = await acceptInvite(client, code)
          finishInvite()
          groups.reload()
          setGroupId(joined)
        }}
      />
    )
  }

  if (source) {
    return <GroupPages source={source} now={now} route={route} onLeave={() => setGroupId(null)} leaveKey="settings.switchGroup" />
  }

  if (groups.status !== 'ready') {
    return <LoadState failed={groups.status === 'error'} errorMessage={t('error.group')} onRetry={groups.reload} />
  }
  return (
    <GroupsPage
      groups={groups.data ?? []}
      onOpen={setGroupId}
      onCreate={async (name) => {
        const created = await createGroup(client, name)
        groups.reload()
        setGroupId(created)
      }}
      onInvite={async (id) => inviteUrl(await createInvite(client, id))}
      onSignOut={onSignOut}
    />
  )
}
