/// <reference path="../index.d.ts" />
import { testHook } from 'react-hooks-testing-library'
import { NextCounter } from '..'
import { Model } from '../../src'

describe('useStore', () => {
  test('create by single model definition', async () => {
    let state: any
    let actions: any
    let count = 0
    const { useStore, subscribe, unsubscribe } = Model(NextCounter)
    testHook(() => {
      ;[state, actions] = useStore()
    })
    expect(state).toEqual({ count: 0 })
    await actions.increment(3)
    expect(state).toEqual({ count: 3 })
    // test subscribe
    subscribe('increment', () => (count += 1))
    await actions.increment(4)
    expect(count).toBe(1)
    expect(state.count).toBe(7)
    // test unsubscribe
    unsubscribe('increment')
    await actions.increment(3)
    expect(state.count).toBe(10)
    expect(count).toBe(1)
  })
})
