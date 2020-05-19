/// <reference path="../index.d.ts" />
import { renderHook } from '@testing-library/react-hooks'
import { Model } from '../../src'
import { Counter } from '..'

describe('selector', () => {
  test("models' selector", async () => {
    let isCounterOdd: boolean = true,
      state: any
    let actionsFirst: any, actionsSecond: any
    let renderTime = 0
    const { useStore, actions } = Model({ Counter })
    renderHook(() => {
      ;[isCounterOdd, actionsFirst] = useStore(
        'Counter',
        ({ count }) => count % 2 !== 0
      )
      renderTime += 1
    })
    renderHook(() => {
      ;[state, actionsSecond] = useStore('Counter')
    })
    expect(isCounterOdd).toBe(false)
    expect(state.count).toBe(0)
    expect(renderTime).toBe(1)
    await actionsFirst.increment(3)
    expect(isCounterOdd).toBe(true)
    expect(state.count).toBe(3)
    expect(renderTime).toBe(2)
    await actionsSecond.increment(4)
    expect(isCounterOdd).toBe(true)
    expect(state.count).toBe(7)
    expect(renderTime).toBe(2)
    await actions.Counter.increment(4)
    expect(isCounterOdd).toBe(true)
    expect(state.count).toBe(11)
    expect(renderTime).toBe(2)
    await actions.Counter.add(1)
    expect(isCounterOdd).toBe(false)
    expect(state.count).toBe(12)
    expect(renderTime).toBe(3)
  })
})
