import { useEffect, useState } from 'react'
import { localDateIn } from '../lib/time'

// Identity changes only when the calendar day does: HomePage reloads on every new `now`.
export function useNow(timeZone: string): Date {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const check = () =>
      setNow((prev) => {
        const t = new Date()
        return localDateIn(t, timeZone) === localDateIn(prev, timeZone) ? prev : t
      })
    // Timers are throttled in background tabs, so also re-check when the tab returns.
    const id = setInterval(check, 60_000)
    document.addEventListener('visibilitychange', check)
    return () => {
      clearInterval(id)
      document.removeEventListener('visibilitychange', check)
    }
  }, [timeZone])
  return now
}
