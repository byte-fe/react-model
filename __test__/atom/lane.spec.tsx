/// <reference path="../index.d.ts" />
import * as React from 'react'
import { renderHook, act } from '@testing-library/react-hooks'
import { render } from '@testing-library/react'
import { act as RAct } from 'react-dom/test-utils'
import { createStore, Model, useAtom, Provider } from '../../src'

describe('lane model', () => {
  test('single model', () => {
    const wrapper = Provider
    const { useStore } = createStore(() => {
      const [count, setCount] = useAtom(1)
      return { count, setCount }
    })
    let renderTimes = 0
    const { result } = renderHook(
      () => {
        const { count, setCount } = useStore()
        renderTimes += 1
        return { renderTimes, count, setCount }
      },
      { wrapper }
    )

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

  test('create store with namespace', () => {
    const wrapper = Provider
    const { useStore } = Model({})
    createStore('Shared', () => {
      const [count, setCount] = useAtom(1)
      return { count, setCount }
    })

    let renderTimes = 0
    const { result } = renderHook(
      () => {
        // @ts-ignore
        const { count, setCount } = useStore('Shared')
        console.group('count: ', count)
        console.group('setCount: ', setCount)
        renderTimes += 1
        return { renderTimes, count, setCount }
      },
      { wrapper }
    )
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

  test('subscribe model', () => {
    const wrapper = Provider
    let subscribeTimes = 0
    const { subscribe, unsubscribe, getState } = createStore(() => {
      const [count, setCount] = useAtom(1)
      return { count, setCount }
    })

    const { result } = renderHook(
      () => {
        const state = getState()
        return { state }
      },
      { wrapper }
    )

    const callback_1 = () => {
      subscribeTimes += 1
    }

    const callback_2 = () => {
      subscribeTimes += 1
    }

    subscribe(callback_1)
    subscribe(callback_2)

    act(() => {
      expect(subscribeTimes).toEqual(0)
    })

    act(() => {
      result.current.state.setCount(5)
    })

    act(() => {
      expect(subscribeTimes).toEqual(2)
      console.error('result.current.state: ', result.current.state)
      expect(result.current.state.count).toBe(5)
    })

    unsubscribe(callback_1)

    act(() => {
      result.current.state.setCount(15)
    })

    act(() => {
      expect(subscribeTimes).toEqual(3)
      expect(result.current.state.count).toBe(15)
    })
  })

  test('pass function to useAtom ', () => {
    const wrapper = Provider
    const { useStore } = createStore(() => {
      const [count, setCount] = useAtom(() => 1)
      return { count, setCount }
    })
    let renderTimes = 0
    const { result } = renderHook(
      () => {
        const { count, setCount } = useStore()
        renderTimes += 1
        return { renderTimes, count, setCount }
      },
      { wrapper }
    )

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

  test('false value can be accepted', () => {
    const wrapper = Provider
    const { useStore } = createStore(() => {
      const [count, setCount] = useAtom(true)
      return { count, setCount }
    })

    let renderTimes = 0
    const { result, rerender } = renderHook(
      () => {
        const { count, setCount } = useStore()
        renderTimes += 1
        return { renderTimes, count, setCount }
      },
      { wrapper }
    )
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

  test('array value is protected', () => {
    const wrapper = Provider
    const { useStore } = createStore(() => {
      const [list, setList] = useAtom([] as number[])
      return { list, setList }
    })

    let renderTimes = 0
    const { result, rerender } = renderHook(
      () => {
        const { list, setList } = useStore()
        renderTimes += 1
        return { renderTimes, list, setList }
      },
      { wrapper }
    )
    act(() => {
      expect(renderTimes).toEqual(1)
      expect(result.current.list.constructor.name).toBe('Array')
    })

    act(() => {
      result.current.setList([1, 2])
    })

    act(() => {
      expect(renderTimes).toEqual(2)
      expect(result.current.list.constructor.name).toBe('Array')
      expect(result.current.list[0]).toBe(1)
      expect(result.current.list[1]).toBe(2)
    })

    act(() => {
      rerender()
    })

    act(() => {
      expect(renderTimes).toEqual(3)
      expect(result.current.list.constructor.name).toBe('Array')
      expect(result.current.list[0]).toBe(1)
      expect(result.current.list[1]).toBe(2)
    })
  })

  test('object value is merged', () => {
    const wrapper = Provider
    const { useStore } = createStore(() => {
      const [obj, setObj] = useAtom({ name: 'Bob', age: 17 })
      return { obj, setObj }
    })

    let renderTimes = 0
    const { result, rerender } = renderHook(
      () => {
        const { obj, setObj } = useStore()
        renderTimes += 1
        return { renderTimes, obj, setObj }
      },
      { wrapper }
    )
    act(() => {
      expect(renderTimes).toEqual(1)
      expect(result.current.obj.age).toBe(17)
      expect(result.current.obj.name).toBe('Bob')
    })

    act(() => {
      result.current.setObj({ age: 18 })
    })

    act(() => {
      expect(renderTimes).toEqual(2)
      expect(result.current.obj.name).toBe('Bob')
      expect(result.current.obj.age).toBe(18)
    })

    act(() => {
      rerender()
    })

    act(() => {
      expect(renderTimes).toEqual(3)
      expect(result.current.obj.name).toBe('Bob')
      expect(result.current.obj.age).toBe(18)
    })

    act(() => {
      result.current.setObj({ name: 'Bom' })
    })

    act(() => {
      expect(renderTimes).toEqual(4)
      expect(result.current.obj.name).toBe('Bom')
      expect(result.current.obj.age).toBe(18)
    })
  })

  test('multiple models', () => {
    const wrapper = Provider
    const { useStore } = createStore(() => {
      const [count, setCount] = useAtom(1)
      const [name, setName] = useAtom('Jane')
      return { count, name, setName, setCount }
    })
    let renderTimes = 0
    const { result } = renderHook(
      () => {
        const { count, setCount, name, setName } = useStore()
        renderTimes += 1
        return { renderTimes, count, setCount, name, setName }
      },
      { wrapper }
    )
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

  test('multiple stores', () => {
    const wrapper = Provider
    const { useStore } = createStore(() => {
      const [count, setCount] = useAtom(1)

      return { count, setCount }
    })

    const { useStore: useOtherStore } = createStore(() => {
      const [name, setName] = useAtom('Jane')
      return { name, setName }
    })
    let renderTimes = 0
    const { result } = renderHook(
      () => {
        const { count, setCount } = useStore()
        const { name, setName } = useOtherStore()
        renderTimes += 1
        return { renderTimes, count, setCount, name, setName }
      },
      { wrapper }
    )

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

  test('share single model between components', () => {
    const wrapper = Provider
    const { useStore } = createStore(() => {
      const [count, setCount] = useAtom(1)
      return { count, setCount }
    })
    let renderTimes = 0
    const { result } = renderHook(
      () => {
        const { count, setCount } = useStore()
        renderTimes += 1
        return { renderTimes, count, setCount }
      },
      { wrapper }
    )

    const { result: mirrorResult } = renderHook(
      () => {
        const { count, setCount } = useStore()
        renderTimes += 1
        return { renderTimes, count, setCount }
      },
      { wrapper }
    )
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

  test('complex case', () => {
    const results: any = {}
    function TestComponent({ id, hook }: any) {
      results[id] = hook()
      return null
    }

    const { useStore } = createStore(() => {
      const [count, setCount] = useAtom(1)
      const [name, setName] = useAtom('Jane')
      return { count, setCount, name, setName }
    })
    const { useStore: useOtherStore } = createStore(() => {
      const [data, setData] = useAtom({ status: 'UNKNOWN' })
      return { data, setData }
    })
    const { useStore: useOnce } = createStore(() => {
      const [status, set] = useAtom(false)
      return { status, set }
    })
    let renderTimes = 0

    render(
      <Provider>
        <TestComponent
          id="first"
          hook={() => {
            const { count, setCount } = useStore()
            const { setData } = useOtherStore()
            renderTimes += 1
            return { renderTimes, count, setCount, setData }
          }}
        />
        <TestComponent
          id="second"
          hook={() => {
            const { setName, name } = useStore()
            const { data } = useOtherStore()
            const { status, set } = useOnce()
            renderTimes += 1
            return { renderTimes, data, setName, name, status, set }
          }}
        />
      </Provider>
    )

    RAct(() => {
      expect(renderTimes).toEqual(2)
      expect(results.second.name).toBe('Jane')
    })

    RAct(() => {
      results.first.setData({ status: 'SUCCESS' })
    })

    RAct(() => {
      expect(renderTimes).toEqual(4)
      expect(results.second.data).toEqual({ status: 'SUCCESS' })
    })

    RAct(() => {
      results.second.setName('Bob')
    })

    RAct(() => {
      expect(renderTimes).toEqual(6)
      expect(results.second.name).toBe('Bob')
      expect(results.second.status).toBe(false)
    })

    RAct(() => {
      results.second.set(true)
    })

    RAct(() => {
      expect(renderTimes).toEqual(8)
      expect(results.second.status).toBe(true)
    })

    RAct(() => {
      results.second.setName('Jane')
    })

    RAct(() => {
      expect(renderTimes).toEqual(10)
      expect(results.second.name).toBe('Jane')
      expect(results.second.status).toBe(true)
      expect(results.second.name).toBe('Jane')
      expect(results.first.count).toBe(1)
    })
  })
})
