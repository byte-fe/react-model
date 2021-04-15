/// <reference path="../index.d.ts" />
import { renderHook, act } from '@testing-library/react-hooks'
import { Model } from '../../src'
import { ExpensiveModel } from '..'

describe('setState', () => {
  test("circular state is forbidden by default", async () => {
    // @ts-ignore
    let isCounterOdd: any,
    // @ts-ignore
      state: any
    let actions: any
    let renderTime = 0
    const { useStore } = Model(ExpensiveModel)
    renderHook(() => {
      ;[state, actions] = useStore()
      renderTime += 1
    })
    renderHook(() => {
      ;[state] = useStore()
    })
    // throw error when set circular state without freezing
    // rerender is not invoked
    await act(async () => {
      try {
        await actions.setState()
      } catch (e) {
        expect(e.message).toContain("Maximum call stack size exceeded")
      }
    })
    expect(renderTime).toBe(1)
  })

  test("pre freeze circular state is allowed", async () => {
    // @ts-ignore
    let isCounterOdd: any,
    // @ts-ignore
      state: any
    let actions: any
    let renderTime = 0
    const { useStore } = Model(ExpensiveModel)
    renderHook(() => {
      ;[state, actions] = useStore()
      renderTime += 1
    })
    renderHook(() => {
      ;[state] = useStore()
    })
    // setState passed when circular state has been freezed
    // rerender is invoked
    await act(async () => {
      try {
        await actions.setPreFreezedDataset()
      } catch (e) {
        expect(true).toBe(false)
      }
    })
    expect(renderTime).toBe(2)
  })
})
