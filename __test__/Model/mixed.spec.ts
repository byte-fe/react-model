/// <reference path="../index.d.ts" />
import { renderHook } from '@testing-library/react-hooks'
import { NextCounter } from '..'
import { Model } from '../../src'

describe('useStore', () => {
  test('create by single model definition', async () => {
    let state: any, nextState: any
    let actions: any, nextActions: any
    let count = 0
    let nextCount = 0
    const Home = Model(NextCounter)
    const { useStore, subscribe, unsubscribe } = Model({ Home, NextCounter })
    renderHook(() => {
      ;[state, actions] = useStore('Home')
      ;[nextState, nextActions] = useStore('NextCounter')
    })

    // Home
    expect(state).toEqual({ count: 0 })
    await actions.increment(3)
    expect(state).toEqual({ count: 3 })
    // test subscribe
    subscribe('Home', 'increment', () => (count += 1))
    await actions.increment(4)
    expect(count).toBe(1)
    expect(state.count).toBe(7)
    // test unsubscribe
    unsubscribe('Home', 'increment')
    await actions.increment(3)
    expect(state.count).toBe(10)
    expect(count).toBe(1)

    // NextCounter
    expect(nextState).toEqual({ count: 0 })
    await nextActions.increment(3)
    expect(nextState).toEqual({ count: 3 })
    // test subscribe
    subscribe('NextCounter', 'increment', () => (nextCount += 1))
    await nextActions.increment(4)
    expect(nextCount).toBe(1)
    expect(nextState.count).toBe(7)
    // test unsubscribe
    unsubscribe('NextCounter', 'increment')
    await nextActions.increment(3)
    expect(nextState.count).toBe(10)
    expect(nextCount).toBe(1)
  })
})
