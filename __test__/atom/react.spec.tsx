/// <reference path="../index.d.ts" />
import { renderHook, act } from '@testing-library/react-hooks'
import { render } from '@testing-library/react'
import { act as RAct } from 'react-dom/test-utils'
import { createStore, useModel, Provider } from '../../src'
import { useState, useEffect } from 'react'
import * as React from 'react'

describe('compatible with useState + useEffect', () => {
  test('compatible with useState', () => {
    const wrapper = Provider
    let renderTimes = 0
    const { result } = renderHook(
      () => {
        const { useStore } = createStore(() => {
          const [count, setCount] = useState(1)
          return { count, setCount }
        })
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

  test('useEffect', () => {
    const wrapper = Provider
    let renderTimes = 0
    let createTimes = 0
    let updateTimes = 0
    // A <A> <B /> </A>
    const { result } = renderHook(
      () => {
        const [count, setCount] = useState(1)
        useEffect(() => {
          createTimes += 1
        }, [])
        useEffect(() => {
          updateTimes += 1
        }, [count])

        renderTimes += 1
        return { renderTimes, count, setCount }
      },
      { wrapper }
    )
    act(() => {
      expect(result.current.renderTimes).toEqual(1)
      expect(result.current.count).toBe(1)
      expect(createTimes).toBe(1)
      expect(updateTimes).toBe(1)
    })

    act(() => {
      result.current.setCount(5)
    })

    act(() => {
      expect(renderTimes).toEqual(2)
      expect(result.current.count).toBe(5)
      expect(createTimes).toBe(1)
      expect(updateTimes).toBe(2)
    })
  })

  test('compatible with useEffect', () => {
    const wrapper = Provider
    let renderTimes = 0
    let createTimes = 0
    let updateTimes = 0
    // A <A> <B /> </A>
    const { result } = renderHook(
      () => {
        const { useStore } = createStore(() => {
          const [count, setCount] = useState(1)
          useEffect(() => {
            createTimes += 1
          }, [])
          useEffect(() => {
            updateTimes += 1
          }, [count])
          return { count, setCount }
        })
        const { count, setCount } = useStore()
        renderTimes += 1
        return { renderTimes, count, setCount }
      },
      { wrapper }
    )
    act(() => {
      expect(result.current.renderTimes).toEqual(1)
      expect(result.current.count).toBe(1)
      expect(createTimes).toBe(1)
      expect(updateTimes).toBe(1)
    })

    act(() => {
      result.current.setCount(5)
    })

    act(() => {
      expect(renderTimes).toEqual(2)
      expect(result.current.count).toBe(5)
      expect(createTimes).toBe(1)
      expect(updateTimes).toBe(2)
    })
  })

  test('createStore with useState outside FC', () => {
    const wrapper = Provider
    const useCount = () => {
      const [count, setCount] = useState(1)
      return { count, setCount }
    }
    const { useStore } = createStore(useCount)
    let renderTimes = 0
    const { result } = renderHook(
      () => {
        const { count, setCount } = useStore()
        renderTimes += 1
        return { renderTimes, count, setCount }
      },
      { wrapper }
    )
    act(async () => {
      expect(result.current.renderTimes).toEqual(1)
      expect(result.current.count).toBe(1)
    })

    act(async () => {
      await result.current.setCount(5)
    })

    act(() => {
      expect(renderTimes).toEqual(2)
      expect(result.current.count).toBe(5)
    })
  })

  test('combine useState and useStore', () => {
    // https://github.com/testing-library/react-hooks-testing-library/issues/615#issuecomment-840512255
    const results: any = {}
    function TestComponent({ id, hook }: any) {
      results[id] = hook()
      return null
    }

    let renderTimes = 0

    const useCount = () => {
      // useState create local state
      const [count, setCount] = useState(1)
      // useModel create shared state
      const [name, setName] = useModel('Jane')
      return { count, setCount, name, setName }
    }
    const { useStore } = createStore(useCount)

    render(
      <Provider>
        <TestComponent
          id="first"
          hook={() => {
            const { count, setCount, name, setName } = useStore()
            renderTimes += 1
            return { renderTimes, count, setCount, name, setName }
          }}
        />
        <TestComponent
          id="second"
          hook={() => {
            const { count, setCount, name } = useStore()
            renderTimes += 1
            return { renderTimes, count, setCount, name }
          }}
        />
      </Provider>
    )

    RAct(() => {
      expect(results.first.renderTimes).toBe(1)
      expect(results.second.renderTimes).toBe(2)
      expect(results.first.count).toBe(1)
    })

    RAct(() => {
      results.second.setCount(5)
    })

    RAct(() => {
      expect(results.first.renderTimes).toEqual(1)
      expect(results.second.renderTimes).toEqual(3)
      expect(results.second.count).toBe(5)
      expect(results.first.count).toBe(1)
    })

    RAct(() => {
      results.first.setCount(50)
    })

    RAct(() => {
      expect(results.first.renderTimes).toEqual(4)
      expect(results.second.renderTimes).toEqual(3)
      expect(results.second.count).toBe(5)
      expect(results.first.count).toBe(50)
    })

    RAct(() => {
      results.first.setName('Bob')
    })

    RAct(() => {
      expect(results.first.renderTimes).toEqual(5)
      expect(results.second.renderTimes).toEqual(6)
      expect(results.first.name).toBe('Bob')
      expect(results.second.name).toBe('Bob')
    })
  })
})
