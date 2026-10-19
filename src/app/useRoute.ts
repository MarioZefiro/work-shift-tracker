import { useSyncExternalStore } from 'react'

export type Route = 'home' | 'persone' | 'profilo' | 'impostazioni' | 'faq'

const ROUTES: readonly Route[] = ['home', 'persone', 'profilo', 'impostazioni', 'faq']

function subscribe(onChange: () => void): () => void {
  window.addEventListener('hashchange', onChange)
  return () => window.removeEventListener('hashchange', onChange)
}

function parse(): Route {
  const name = window.location.hash.replace(/^#\/?/, '')
  return ROUTES.find((r) => r === name) ?? 'home'
}

export function useRoute(): Route {
  return useSyncExternalStore(subscribe, parse)
}
