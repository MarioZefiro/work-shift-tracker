import { useMemo, useSyncExternalStore } from 'react'

export type Route = 'home' | 'people' | 'profile' | 'settings' | 'faq' | 'invite'

const ROUTES: readonly Route[] = ['home', 'people', 'profile', 'settings', 'faq', 'invite']

function subscribe(onChange: () => void): () => void {
  window.addEventListener('hashchange', onChange)
  return () => window.removeEventListener('hashchange', onChange)
}

const getHash = () => window.location.hash

export function useRoute(): { name: Route; params: string[] } {
  // The snapshot must be a stable primitive; the object is derived from it.
  const hash = useSyncExternalStore(subscribe, getHash)
  return useMemo(() => {
    const [first, ...params] = hash.replace(/^#\/?/, '').split('/').filter(Boolean)
    const name = ROUTES.find((r) => r === first)
    return name ? { name, params } : { name: 'home', params: [] }
  }, [hash])
}
