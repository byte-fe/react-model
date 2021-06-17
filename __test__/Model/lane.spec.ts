/// <reference path="../index.d.ts" />
import { renderHook, act } from '@testing-library/react-hooks'
import { createStore, useModel } from '../../src'

describe('lane model', () => {
  test('single model', async () => {
    const { useStore } = createStore(() => {
      const [count, setCount] = useModel(1)
      return { count, setCount }
    })
    let renderTimes = 0
    const { result } = renderHook(() => {
      const { count, setCount } = useStore()
      renderTimes += 1
      return { renderTimes, count, setCount }
    })
    await act(async () => {
      expect(renderTimes).toEqual(1)
      expect(result.current.count).toBe(1)
    })

    await act(async () => {
      await result.current.setCount(5)
    })

    await act(() => {
      expect(renderTimes).toEqual(2)
      expect(result.current.count).toBe(5)
    })
  })

  test('multiple models', async () => {
    const { useStore } = createStore(() => {
      const [count, setCount] = useModel(1)
      const [name, setName] = useModel('Jane')
      return { count, name, setName, setCount }
    })
    let renderTimes = 0
    const { result } = renderHook(() => {
      const { count, setCount, name, setName } = useStore()
      renderTimes += 1
      return { renderTimes, count, setCount, name, setName }
    })
    await act(async () => {
      expect(renderTimes).toEqual(1)
      expect(result.current.count).toBe(1)
    })

    await act(async () => {
      await result.current.setCount(5)
    })

    await act(() => {
      expect(renderTimes).toEqual(2)
      expect(result.current.count).toBe(5)
      expect(result.current.name).toBe('Jane')
    })

    await act(async () => {
      await result.current.setName('Bob')
    })

    await act(() => {
      expect(renderTimes).toEqual(3)
      expect(result.current.name).toBe('Bob')
      expect(result.current.count).toBe(5)
    })
  })

  test('multiple stores', async () => {
    const { useStore } = createStore(() => {
      const [count, setCount] = useModel(1)

      return { count, setCount }
    })

    const { useStore: useOtherStore } = createStore(() => {
      const [name, setName] = useModel('Jane')
      return { name, setName }
    })
    let renderTimes = 0
    const { result } = renderHook(() => {
      const { count, setCount } = useStore()
      const { name, setName } = useOtherStore()
      renderTimes += 1
      return { renderTimes, count, setCount, name, setName }
    })
    await act(async () => {
      expect(renderTimes).toEqual(1)
      expect(result.current.count).toBe(1)
    })

    await act(async () => {
      await result.current.setCount(5)
    })

    await act(() => {
      expect(renderTimes).toEqual(2)
      expect(result.current.count).toBe(5)
      expect(result.current.name).toBe('Jane')
    })

    await act(async () => {
      await result.current.setName('Bob')
    })

    await act(() => {
      expect(renderTimes).toEqual(3)
      expect(result.current.name).toBe('Bob')
      expect(result.current.count).toBe(5)
    })
  })

  test('share single model between components', async () => {
    const { useStore } = createStore(() => {
      const [count, setCount] = useModel(1)
      return { count, setCount }
    })
    let renderTimes = 0
    const { result } = renderHook(() => {
      const { count, setCount } = useStore()
      renderTimes += 1
      return { renderTimes, count, setCount }
    })

    const { result: mirrorResult } = renderHook(() => {
      const { count, setCount } = useStore()
      renderTimes += 1
      return { renderTimes, count, setCount }
    })
    await act(async () => {
      expect(renderTimes).toEqual(2)
      expect(mirrorResult.current.count).toBe(1)
    })

    await act(async () => {
      await result.current.setCount(5)
    })

    await act(() => {
      expect(renderTimes).toEqual(4)
      expect(mirrorResult.current.count).toBe(5)
    })
  })

  test('complex case', async () => {
    const { useStore, getState } = createStore(() => {
      const [count, setCount] = useModel(1)
      const [name, setName] = useModel('Jane')
      return { count, setCount, name, setName }
    })
    const { useStore: useOtherStore } = createStore(() => {
      const [data, setData] = useModel({ status: 'UNKNOWN' })
      return { data, setData }
    })
    const { useStore: useOnce } = createStore(() => {
      const [status, set] = useModel(false)
      return { status, set }
    })
    let renderTimes = 0
    const { result } = renderHook(() => {
      const { count, setCount } = useStore()
      const { setData } = useOtherStore()
      renderTimes += 1
      return { renderTimes, count, setCount, setData }
    })

    const { result: mirrorResult } = renderHook(() => {
      const { setName, name } = useStore()
      const { data } = useOtherStore()
      const { status, set } = useOnce()
      renderTimes += 1
      return { renderTimes, data, setName, name, status, set }
    })
    await act(async () => {
      expect(renderTimes).toEqual(2)
      expect(mirrorResult.current.name).toBe('Jane')
    })

    await act(async () => {
      await result.current.setData({ status: 'SUCCESS' })
    })

    // Both component will rerender
    // TODO: Only rerender second FC
    await act(() => {
      expect(renderTimes).toEqual(4)
      expect(mirrorResult.current.data).toEqual({ status: 'SUCCESS' })
    })

    await act(async () => {
      await mirrorResult.current.setName('Bob')
    })

    await act(() => {
      expect(renderTimes).toEqual(6)
      expect(mirrorResult.current.name).toBe('Bob')
      expect(mirrorResult.current.status).toBe(false)
    })

    await act(async () => {
      await mirrorResult.current.set(true)
    })

    await act(() => {
      expect(renderTimes).toEqual(7)
      expect(mirrorResult.current.status).toBe(true)
    })

    await act(async () => {
      await mirrorResult.current.setName('Jane')
    })

    await act(() => {
      expect(renderTimes).toEqual(9)
      expect(mirrorResult.current.name).toBe('Jane')
      expect(mirrorResult.current.status).toBe(true)
      expect(getState().name).toBe('Jane')
      expect(getState().count).toBe(1)
    })
  })
})
