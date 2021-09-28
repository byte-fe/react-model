/// <reference path="../index.d.ts" />
import { renderHook } from '@testing-library/react-hooks'
import { NextCounter } from '..'
import { Model } from '../../src'

describe('useStore', () => {
  test('create by single model definition', async () => {
    let state: any
    let actions: any
    let mirrorState: any
    let mirrorActions: any
    let count = 0
    const { useStore, subscribe, unsubscribe, getState } = Model({
      NextCounter
    })
    const {
      useStore: useMirrorStore,
      subscribe: mirrorSubscribe,
      unsubscribe: mirrorUnSubscribe,
      getState: getMirrorState
    } = Model({ NextCounter })
    renderHook(() => {
      ;[state, actions] = useStore('NextCounter')
      ;[mirrorState, mirrorActions] = useMirrorStore('NextCounter')
    })
    expect(state).toEqual({ count: 0 })
    expect(mirrorState).toEqual({ count: 0 })

    mirrorSubscribe('NextCounter', 'increment', () => (count += 1))

    await actions.increment(3)
    expect(state).toEqual({ count: 3 })
    expect(mirrorState).toEqual({ count: 0 })
    expect(count).toBe(0)

    await mirrorActions.increment(3)
    expect(state).toEqual({ count: 3 })
    expect(mirrorState).toEqual({ count: 3 })
    expect(count).toBe(1)

    // test subscribe
    subscribe('NextCounter', 'increment', () => (count += 1))
    await actions.increment(4)
    expect(count).toBe(2)
    expect(state.count).toBe(7)
    expect(mirrorState.count).toBe(3)
    expect(getState('NextCounter').count).toBe(7)
    expect(getMirrorState('NextCounter').count).toBe(3)

    // test unsubscribe
    unsubscribe('NextCounter', 'increment')
    mirrorUnSubscribe('NextCounter', 'increment')
    await actions.increment(3)
    expect(state.count).toBe(10)
    expect(mirrorState.count).toBe(3)
    expect(getState('NextCounter').count).toBe(10)
    expect(getMirrorState('NextCounter').count).toBe(3)
    expect(count).toBe(2)
  })
})
