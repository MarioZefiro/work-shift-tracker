import { act, renderHook, waitFor } from '@testing-library/react'
import { expect, test } from 'vitest'
import { useAsync } from './useAsync'

test('ignores a stale result that resolves after a newer request', async () => {
  const resolvers: ((v: string) => void)[] = []
  const load = () => new Promise<string>((res) => resolvers.push(res))
  const { result, rerender } = renderHook(({ dep }) => useAsync(load, [dep]), { initialProps: { dep: 1 } })
  rerender({ dep: 2 })
  await waitFor(() => expect(resolvers).toHaveLength(2))
  expect(result.current.status).toBe('loading')
  await act(async () => resolvers[1]('new'))
  expect(result.current).toMatchObject({ status: 'ready', data: 'new' })
  await act(async () => resolvers[0]('old'))
  expect(result.current.data).toBe('new')
})

test('reload runs the loader again and shows loading meanwhile', async () => {
  let n = 0
  const { result } = renderHook(() => useAsync(() => Promise.resolve(++n), []))
  await waitFor(() => expect(result.current.data).toBe(1))
  act(() => result.current.reload())
  expect(result.current.status).toBe('loading')
  await waitFor(() => expect(result.current.data).toBe(2))
})

test('reports an error and recovers on reload', async () => {
  let fail = true
  const { result } = renderHook(() => useAsync(() => (fail ? Promise.reject(new Error('x')) : Promise.resolve('ok')), []))
  await waitFor(() => expect(result.current.status).toBe('error'))
  fail = false
  act(() => result.current.reload())
  await waitFor(() => expect(result.current).toMatchObject({ status: 'ready', data: 'ok' }))
})
