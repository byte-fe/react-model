/// <reference path="../index.d.ts" />
import { renderHook } from '@testing-library/react-hooks'
// @ts-ignore
import { ErrorModel as EM } from './errorModel'
import { Model } from '../../src'

describe('useStore', () => {
  test('create by single model error definition', async () => {
    let state: any
    let actions: any
    let count = 0
    const ErrorModel = Model(EM)
    // @ts-ignore
    const { useStore, subscribe, unsubscribe } = Model({ ErrorModel })
    renderHook(() => {
      ;[state, actions] = useStore('ErrorModel')
    })
    expect(actions).toEqual({})
    expect(actions.increment).toBe(undefined)
    // await actions.increment(3)
    expect(state).toEqual({})
    // test subscribe
    // @ts-ignore
    subscribe('increment', () => (count += 1))
    expect(count).toBe(0)
    expect(state.count).toBe(undefined)
    // test unsubscribe
    // @ts-ignore
    unsubscribe('increment')
    expect(actions).toEqual({})
    expect(state.count).toBe(undefined)
    expect(count).toBe(0)
  })
})
