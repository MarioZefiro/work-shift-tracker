import { AppShell } from './app/AppShell'
import { useRoute, type Route } from './app/useRoute'

const TITLES: Record<Route, string> = {
  home: 'Home',
  persone: 'Persone',
  profilo: 'Profilo',
  impostazioni: 'Impostazioni',
  faq: 'FAQ',
}

export default function App() {
  const route = useRoute()
  return (
    <AppShell route={route}>
      <h1>{TITLES[route]}</h1>
    </AppShell>
  )
}
