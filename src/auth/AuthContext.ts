import { createContext, useContext } from 'react'

export interface Auth {
  status: 'loading' | 'signedOut' | 'signedIn'
  userId: string | null
  signInWithEmail(email: string): Promise<void>
  signOut(): Promise<void>
}

export const AuthContext = createContext<Auth | null>(null)

export function useAuth(): Auth {
  const auth = useContext(AuthContext)
  if (!auth) throw new Error('useAuth must be used inside AuthProvider')
  return auth
}
