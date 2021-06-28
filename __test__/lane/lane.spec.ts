/// <reference path="../index.d.ts" />
import { renderHook, act } from '@testing-library/react-hooks'
import { createStore, useModel, Model } from '../../src'

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

    act(() => {
      expect(result.current.renderTimes).toEqual(1)
      expect(result.current.count).toBe(1)
    })

    act(() => {
      result.current.setCount(5)
    })

    act(() => {
      expect(renderTimes).toEqual(2)
      expect(result.current.count).toBe(5)
    })
  })

  test('create store with namespace', async () => {
    const { useStore } = Model({})
    createStore('Shared', () => {
      const [count, setCount] = useModel(1)
      return { count, setCount }
    })

    let renderTimes = 0
    const { result } = renderHook(() => {
      // @ts-ignore
      const { count, setCount } = useStore('Shared')
      console.group('count: ', count)
      console.group('setCount: ', setCount)
      renderTimes += 1
      return { renderTimes, count, setCount }
    })
    act(() => {
      expect(renderTimes).toEqual(1)
      expect(result.current.count).toBe(1)
    })

    act(() => {
      // @ts-ignore
      result.current.setCount(5)
    })

    act(() => {
      expect(renderTimes).toEqual(2)
      expect(result.current.count).toBe(5)
    })
  })

  test('pass function to useModel ', async () => {
    const { useStore } = createStore(() => {
      const [count, setCount] = useModel(() => 1)
      return { count, setCount }
    })
    let renderTimes = 0
    const { result } = renderHook(() => {
      const { count, setCount } = useStore()
      renderTimes += 1
      return { renderTimes, count, setCount }
    })

    act(() => {
      expect(renderTimes).toEqual(1)
      expect(result.current.count).toBe(1)
    })

    act(() => {
      result.current.setCount((count) => count + 1)
    })

    act(() => {
      expect(renderTimes).toEqual(2)
      expect(result.current.count).toBe(2)
    })
  })

  test('false value can be accepted', async () => {
    const { useStore } = createStore(() => {
      const [count, setCount] = useModel(true)
      return { count, setCount }
    })

    let renderTimes = 0
    const { result, rerender } = renderHook(() => {
      const { count, setCount } = useStore()
      renderTimes += 1
      return { renderTimes, count, setCount }
    })
    act(() => {
      expect(renderTimes).toEqual(1)
      expect(result.current.count).toBe(true)
    })

    act(() => {
      result.current.setCount(false)
    })

    act(() => {
      expect(renderTimes).toEqual(2)
      expect(result.current.count).toBe(false)
    })

    act(() => {
      rerender()
    })

    act(() => {
      expect(renderTimes).toEqual(3)
      expect(result.current.count).toBe(false)
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
    act(() => {
      expect(renderTimes).toEqual(1)
      expect(result.current.count).toBe(1)
    })

    act(() => {
      result.current.setCount(5)
    })

    act(() => {
      expect(renderTimes).toEqual(2)
      expect(result.current.count).toBe(5)
      expect(result.current.name).toBe('Jane')
    })

    act(() => {
      result.current.setName('Bob')
    })

    act(() => {
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

    act(() => {
      expect(renderTimes).toEqual(1)
      expect(result.current.count).toBe(1)
    })

    act(() => {
      result.current.setCount(5)
    })

    act(() => {
      expect(renderTimes).toEqual(2)
      expect(result.current.count).toBe(5)
      expect(result.current.name).toBe('Jane')
    })

    act(() => {
      result.current.setName('Bob')
    })

    act(() => {
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
    act(() => {
      expect(renderTimes).toEqual(2)
      expect(mirrorResult.current.count).toBe(1)
    })

    act(() => {
      result.current.setCount(5)
    })

    act(() => {
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
    act(() => {
      expect(renderTimes).toEqual(2)
      expect(mirrorResult.current.name).toBe('Jane')
    })

    act(() => {
      result.current.setData({ status: 'SUCCESS' })
    })

    // Both component will rerender
    // TODO: Only rerender second FC
    act(() => {
      expect(renderTimes).toEqual(4)
      expect(mirrorResult.current.data).toEqual({ status: 'SUCCESS' })
    })

    act(() => {
      mirrorResult.current.setName('Bob')
    })

    act(() => {
      expect(renderTimes).toEqual(6)
      expect(mirrorResult.current.name).toBe('Bob')
      expect(mirrorResult.current.status).toBe(false)
    })

    act(() => {
      mirrorResult.current.set(true)
    })

    act(() => {
      expect(renderTimes).toEqual(7)
      expect(mirrorResult.current.status).toBe(true)
    })

    act(() => {
      mirrorResult.current.setName('Jane')
    })

    act(() => {
      expect(renderTimes).toEqual(9)
      expect(mirrorResult.current.name).toBe('Jane')
      expect(mirrorResult.current.status).toBe(true)
      expect(getState().name).toBe('Jane')
      expect(getState().count).toBe(1)
    })
  })
})
