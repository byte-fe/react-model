/// <reference path="../index.d.ts" />
import { renderHook, act } from '@testing-library/react-hooks'
import { createStore, useAtom, Provider } from '../../src'

describe('migrate test', () => {
  test('migrate from v4.0.x', () => {
    const wrapper = Provider
    const store = createStore(() => {
      const [state, setState] = useAtom({ count: 0, otherKey: 'key' })
      const actions = {
        add: (params: number) => {
          return setState({
            count: state.count + params
          })
        },
        addCaller: () => {
          actions.add(5)
        },
        increment: (params: number) => {
          return setState((state) => {
            state.count += params
          })
        }
      }
      return [state, actions] as const
    })

    let renderTimes = 0

    const { result } = renderHook(
      () => {
        renderTimes += 1
        const [state, actions] = store.useStore()
        return { state, renderTimes, actions }
      },
      { wrapper }
    )

    act(() => {
      expect(result.current.renderTimes).toEqual(1)
      expect(result.current.state.count).toBe(0)
    })

    act(() => {
      result.current.actions.addCaller()
    })

    act(() => {
      expect(renderTimes).toEqual(2)
      expect(result.current.state.count).toBe(5)
      expect(result.current.state.otherKey).toBe('key')
    })

    act(() => {
      result.current.actions.increment(5)
    })

    act(() => {
      expect(renderTimes).toEqual(3)
      expect(result.current.state.count).toBe(10)
    })
  })
})
