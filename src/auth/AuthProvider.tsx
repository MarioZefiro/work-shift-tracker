import type { SupabaseClient } from '@supabase/supabase-js'
import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { AuthContext, type Auth } from './AuthContext'

// A null client means Supabase is not configured: the demo keeps working and sign-in says why it cannot.
export function AuthProvider({ client, children }: { client: SupabaseClient | null; children: ReactNode }) {
  const [state, setState] = useState<{ ready: boolean; userId: string | null }>({ ready: client === null, userId: null })

  useEffect(() => {
    if (!client) return
    // supabase-js reports the stored session through this listener as its first event.
    const { data } = client.auth.onAuthStateChange((_event, session) =>
      setState({ ready: true, userId: session?.user.id ?? null }),
    )
    return () => data.subscription.unsubscribe()
  }, [client])

  const auth = useMemo<Auth>(
    () => ({
      status: !state.ready ? 'loading' : state.userId ? 'signedIn' : 'signedOut',
      userId: state.userId,
      async signInWithEmail(email) {
        if (!client) throw new Error('Supabase is not configured')
        const { error } = await client.auth.signInWithOtp({
          email,
          // The link must land back under the app's base path, not at the site root.
          options: { emailRedirectTo: window.location.origin + import.meta.env.BASE_URL },
        })
        if (error) throw error
      },
      async signOut() {
        if (!client) return
        const { error } = await client.auth.signOut()
        if (error) throw error
      },
    }),
    [client, state],
  )

  return <AuthContext.Provider value={auth}>{children}</AuthContext.Provider>
}
