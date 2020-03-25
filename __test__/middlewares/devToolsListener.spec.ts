/// <reference path="../index.d.ts" />
;(window as any).__REDUX_DEVTOOLS_EXTENSION__ = {
  connect: () => {},
  send: () => {}
}
import { renderHook } from '@testing-library/react-hooks'
import { Model } from '../../src'
import { Counter } from '..'

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
})
