/// <reference path="../index.d.ts" />
import { renderHook, act } from '@testing-library/react-hooks'
import { createStore, useModel } from '../../src'
import { useState, useEffect } from 'react'

describe('compatible with useState + useEffect', () => {
  test('compatible with useState', async () => {
    let renderTimes = 0
    const { result } = renderHook(() => {
      const { useStore } = createStore(() => {
        const [count, setCount] = useState(1)
        return { count, setCount }
      })
      const { count, setCount } = useStore()
      renderTimes += 1
      return { renderTimes, count, setCount }
    })
    await act(async () => {
      expect(result.current.renderTimes).toEqual(1)
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

  test('useEffect', async () => {
    let renderTimes = 0
    let createTimes = 0
    let updateTimes = 0
    // A <A> <B /> </A>
    const { result } = renderHook(() => {
      const [count, setCount] = useState(1)
      useEffect(() => {
        createTimes += 1
      }, [])
      useEffect(() => {
        updateTimes += 1
      }, [count])

      renderTimes += 1
      return { renderTimes, count, setCount }
    })
    await act(async () => {
      expect(result.current.renderTimes).toEqual(1)
      expect(result.current.count).toBe(1)
      expect(createTimes).toBe(1)
      expect(updateTimes).toBe(1)
    })

    await act(async () => {
      await result.current.setCount(5)
    })

    await act(() => {
      expect(renderTimes).toEqual(2)
      expect(result.current.count).toBe(5)
      expect(createTimes).toBe(1)
      expect(updateTimes).toBe(2)
    })
  })

  test('compatible with useEffect', async () => {
    let renderTimes = 0
    let createTimes = 0
    let updateTimes = 0
    // A <A> <B /> </A>
    const { result } = renderHook(() => {
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
    })
    await act(async () => {
      expect(result.current.renderTimes).toEqual(1)
      expect(result.current.count).toBe(1)
      expect(createTimes).toBe(1)
      expect(updateTimes).toBe(1)
    })

    await act(async () => {
      await result.current.setCount(5)
    })

    await act(() => {
      expect(renderTimes).toEqual(2)
      expect(result.current.count).toBe(5)
      expect(createTimes).toBe(1)
      expect(updateTimes).toBe(2)
    })
  })

  test('createStore with useState outside FC', async () => {
    const useCount = () => {
      const [count, setCount] = useState(1)
      return { count, setCount }
    }
    const { useStore } = createStore(useCount)
    let renderTimes = 0
    const { result } = renderHook(() => {
      const { count, setCount } = useStore()
      renderTimes += 1
      return { renderTimes, count, setCount }
    })
    await act(async () => {
      expect(result.current.renderTimes).toEqual(1)
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

  test('combine useState and useStore', async () => {
    const useCount = () => {
      // useState create local state
      const [count, setCount] = useState(1)
      // useModel create shared state
      const [name, setName] = useModel('Jane')
      return { count, setCount, name, setName }
    }
    const { useStore } = createStore(useCount)
    let renderTimes = 0
    const { result } = renderHook(() => {
      const { count, setCount, name, setName } = useStore()
      renderTimes += 1
      return { renderTimes, count, setCount, name, setName }
    })
    const { result: otherResult } = renderHook(() => {
      const { count, setCount, name } = useStore()
      renderTimes += 1
      return { renderTimes, count, setCount, name }
    })

    await act(async () => {
      expect(result.current.renderTimes).toBe(1)
      expect(otherResult.current.renderTimes).toBe(2)
      expect(result.current.count).toBe(1)
    })

    await act(() => {
      otherResult.current.setCount(5)
    })

    await act(() => {
      expect(result.current.renderTimes).toEqual(1)
      expect(otherResult.current.renderTimes).toEqual(3)
      expect(otherResult.current.count).toBe(5)
      expect(result.current.count).toBe(1)
    })

    await act(() => {
      result.current.setCount(50)
    })

    await act(() => {
      expect(result.current.renderTimes).toEqual(4)
      expect(otherResult.current.renderTimes).toEqual(3)
      expect(otherResult.current.count).toBe(5)
      expect(result.current.count).toBe(50)
    })

    await act(async () => {
      result.current.setName('Bob')
    })

    await act(() => {
      expect(result.current.renderTimes).toEqual(5)
      expect(otherResult.current.renderTimes).toEqual(6)
      expect(result.current.name).toBe('Bob')
      expect(otherResult.current.name).toBe('Bob')
    })
  })
})
