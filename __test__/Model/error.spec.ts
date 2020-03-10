/// <reference path="../index.d.ts" />
import { renderHook } from '@testing-library/react-hooks'
// @ts-ignore
import { ErrorModel } from './errorModel'
import { Model } from '../../src'

describe('useStore', () => {
  test('create by single model definition', async () => {
    let state: any
    let actions: any
    let count = 0
    // @ts-ignore
    const { useStore, subscribe, unsubscribe } = Model(ErrorModel)
    renderHook(() => {
      ;[state, actions] = useStore()
    })
    expect(state).toEqual({})
    expect(actions.increment).toBe(undefined)
    // await actions.increment(3)
    expect(state).toEqual({})
    // test subscribe
    subscribe('increment', () => (count += 1))
    expect(actions).toEqual({})
    expect(count).toBe(0)
    expect(state.count).toBe(undefined)
    // test unsubscribe
    unsubscribe('increment')
    expect(actions).toEqual({})
    expect(state.count).toBe(undefined)
    expect(count).toBe(0)
  })
})
