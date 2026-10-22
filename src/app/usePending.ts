import { useState } from 'react'

// Wraps a request so its trigger can be disabled while it runs; a second tap would post twice.
export function usePending() {
  const [pending, setPending] = useState(false)
  async function run(action: () => Promise<void>) {
    setPending(true)
    try {
      await action()
    } finally {
      setPending(false)
    }
  }
  return [pending, run] as const
}
