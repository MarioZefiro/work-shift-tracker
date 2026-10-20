import { useEffect, useState } from 'react'

type Result<T> = { n: number; status: 'error' } | { n: number; status: 'ready'; data: T }

const sameDeps = (a: unknown[], b: unknown[]) => a.length === b.length && a.every((x, i) => Object.is(x, b[i]))

// Runs `load` again when `deps` change or `reload` is called. Only the latest request can set the result.
export function useAsync<T>(load: () => Promise<T>, deps: unknown[]) {
  // Request counter bumped during render (not in an effect): until a result tagged with the
  // current counter arrives, the status is derived as 'loading' without a synchronous setState in the effect.
  const [req, setReq] = useState({ n: 0, deps, load })
  const [result, setResult] = useState<Result<T> | null>(null)

  if (!sameDeps(req.deps, deps)) setReq({ n: req.n + 1, deps, load })

  useEffect(() => {
    let cancelled = false
    const { n, load } = req
    load().then(
      (data) => {
        if (!cancelled) setResult({ n, status: 'ready', data })
      },
      () => {
        if (!cancelled) setResult({ n, status: 'error' })
      },
    )
    return () => {
      cancelled = true
    }
  }, [req])

  const current = result && result.n === req.n ? result : null
  return {
    status: current?.status ?? ('loading' as const),
    data: current?.status === 'ready' ? current.data : undefined,
    reload: () => setReq((r) => ({ ...r, n: r.n + 1, load })),
  }
}
