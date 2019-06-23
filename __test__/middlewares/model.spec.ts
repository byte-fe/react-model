/// <reference path="../index.d.ts" />
import '@testing-library/react/cleanup-after-each'
process.env.NODE_ENV = 'production'
import { renderHook } from '@testing-library/react-hooks'
import { NextCounterModel } from '..'
import { Model } from '../../src'

describe('NextModel', () => {
  test("allows you to customize model's middleware", async () => {
    let actions: any
    let state: any
    const { useStore, getActions } = Model({ NextCounterModel })
    const beginTime = Date.now()
    renderHook(() => {
      ;[state, actions] = useStore('NextCounterModel')
    })
    await actions.increment(2)
    await getActions('NextCounterModel').increment(1)
    expect(Date.now() - beginTime > 300)
    expect(state.count).toBe(3)
  })
})
