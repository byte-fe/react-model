/// <reference path="../index.d.ts" />
process.env.NODE_ENV = 'production'
import { renderHook } from '@testing-library/react-hooks'
import { NextCounterModel } from '..'
import { Model } from '../../src'

describe('NextModel', () => {
  test("allows you to customize model's middleware", async () => {
    let actions: any, nextActions: any
    let state: any, nextState: any
    const WrapperModel = Model(NextCounterModel)
    const { useStore, getActions } = Model({ NextCounterModel, WrapperModel })
    const beginTime = Date.now()
    renderHook(() => {
      ;[state, actions] = useStore('NextCounterModel')
      ;[nextState, nextActions] = useStore('WrapperModel')
    })
    await actions.increment(2)
    await getActions('NextCounterModel').increment(1)
    expect(Date.now() - beginTime > 300)
    expect(state.count).toBe(3)
    await nextActions.increment(2)
    await getActions('WrapperModel').increment(1)
    expect(nextState.count).toBe(3)
  })
})
