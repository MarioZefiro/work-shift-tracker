import type { SupabaseClient } from '@supabase/supabase-js'
import { useEffect, useState } from 'react'
import { AccountApp } from './AccountApp'
import { GroupPages } from './GroupPages'
import { AuthProvider } from './auth/AuthProvider'
import { useAuth } from './auth/AuthContext'
import { useNow } from './app/useNow'
import { useRoute } from './app/useRoute'
import type { DataSource } from './data/DataSource'
import { TIME_ZONE, createDemoSource } from './data/demo'
import { rememberInvite } from './data/supabase/pendingInvite'
import { LandingPage } from './pages/LandingPage'
import { LoadState } from './pages/LoadState'
import { LoginPage } from './pages/LoginPage'
import { useI18n } from './i18n/I18nContext'

// `client` is null when Supabase is not configured: only the demo is available then.
export default function App({ client }: { client: SupabaseClient | null }) {
  return (
    <AuthProvider client={client}>
      <AppBody client={client} />
    </AuthProvider>
  )
}

function AppBody({ client }: { client: SupabaseClient | null }) {
  const { t } = useI18n()
  // Signed-in groups all use Europe/Rome (the column default); a per-group zone needs the group loaded first.
  const now = useNow(TIME_ZONE)
  const auth = useAuth()
  const { name: route, params } = useRoute()
  const [demo, setDemo] = useState<DataSource | null>(null)
  const [left, setLeft] = useState(false)
  const [loggingIn, setLoggingIn] = useState(false)
  const inviteCode = route === 'invite' ? (params[0] ?? null) : null

  // The email link opens in a new tab, so the code has to survive in storage until the user is signed in.
  useEffect(() => {
    if (inviteCode && auth.status === 'signedOut') rememberInvite(inviteCode)
  }, [inviteCode, auth.status])

  if (demo) {
    return (
      <GroupPages
        source={demo}
        now={now}
        route={route}
        onLeave={() => {
          // Otherwise the next demo would reopen the page the user left from.
          window.location.hash = '#/'
          setLeft(true)
          setDemo(null)
        }}
      />
    )
  }

  if (auth.status === 'loading') {
    return (
      <main className="landing">
        <LoadState failed={false} errorMessage={t('error.group')} onRetry={() => undefined} />
      </main>
    )
  }

  if (client && auth.status === 'signedIn' && auth.userId) {
    return <AccountApp client={client} userId={auth.userId} now={now} onSignOut={() => void auth.signOut().catch(() => undefined)} />
  }

  if (client && (loggingIn || inviteCode || auth.linkError)) {
    return (
      <LoginPage
        notice={auth.linkError ? t('auth.login.expired') : undefined}
        onSubmit={async (email) => {
          // Forgetting the error alone would send the user back to the landing page, away from this form.
          setLoggingIn(true)
          auth.clearLinkError()
          await auth.signInWithEmail(email)
        }}
        onBack={
          inviteCode && !auth.linkError
            ? undefined
            : () => {
                auth.clearLinkError()
                setLoggingIn(false)
              }
        }
      />
    )
  }

  return (
    <LandingPage
      focusHeading={left}
      onLogin={client ? () => setLoggingIn(true) : undefined}
      onStart={() => {
        setLeft(false)
        // Source stays fixed after start: demo data covers eight weeks from the start week.
        setDemo(createDemoSource(now))
      }}
    />
  )
}
