/// <reference path="../index.d.ts" />
;(window as any).__REDUX_DEVTOOLS_EXTENSION__ = {
  connect: () => {},
  send: () => {}
}
import { renderHook, act } from '@testing-library/react-hooks'
import { Model, middlewares, createStore, useModel } from '../../src'
import { Counter } from '..'

middlewares.config.devtools.enable = true

describe('withDevTools', () => {
  test("won't break the behavior without DevTools", async () => {
    let state: any
    let actions: any
    const { useStore } = Model({ Counter })
    renderHook(() => {
      ;[state, actions] = useStore('Counter')
    })
    expect(state).toEqual({ count: 0 })
    await actions.increment(3)
    expect(state.count).toBe(3)
  })

  test('support createStore', () => {
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
})
