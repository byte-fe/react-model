/// <reference path="../index.d.ts" />
import { renderHook } from '@testing-library/react-hooks'
import { Model } from '../../src'
import { Counter } from '..'

describe('selector', () => {
  test("model's selector", async () => {
    let selectedState: { odd: boolean; count?: number } = { odd: true },
      state: any
    let actionsFirst: any, actionsSecond: any
    let renderTime = 0
    const { useStore, actions } = Model(Counter)
    renderHook(() => {
      ;[selectedState, actionsFirst] = useStore(({ count }) =>
        count < 10
          ? {
              odd: count % 2 !== 0
            }
          : {
              count,
              odd: count % 2 !== 0
            }
      )
      renderTime += 1
    })
    renderHook(() => {
      ;[state, actionsSecond] = useStore()
    })
    expect(selectedState.odd).toBe(false)
    expect(state.count).toBe(0)
    expect(renderTime).toBe(1)
    await actionsFirst.increment(3)
    // odd state change, rerender
    expect(selectedState.odd).toBe(true)
    expect(state.count).toBe(3)
    expect(renderTime).toBe(2)
    await actionsSecond.increment(4)
    expect(selectedState.odd).toBe(true)
    expect(state.count).toBe(7)
    expect(renderTime).toBe(2)
    await actions.increment(4)
    // selected keys num + 1, rerender
    expect(selectedState.odd).toBe(true)
    expect(state.count).toBe(11)
    expect(renderTime).toBe(3)
    await actions.add(1)
    // odd state change, rerender
    expect(selectedState.odd).toBe(false)
    expect(state.count).toBe(12)
    expect(renderTime).toBe(4)
  })
})
