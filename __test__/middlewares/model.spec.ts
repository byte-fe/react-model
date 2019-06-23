/// <reference path="../index.d.ts" />
import '@testing-library/react/cleanup-after-each'
process.env.NODE_ENV = 'production'
import { testHook } from 'react-hooks-testing-library'
import { NextCounterModel } from '..'
import { Model } from '../../src'

describe('NextModel', () => {
  test("allows you to customize model's middleware", async () => {
    let actions: any
    let state: any
    const { useStore, getActions } = Model({ NextCounterModel })
    const beginTime = Date.now()
    testHook(() => {
      ;[state, actions] = useStore('NextCounterModel')
    })
    await actions.increment(2)
    await getActions('NextCounterModel').increment(1)
    expect(Date.now() - beginTime > 300)
    expect(state.count).toBe(3)
  })
})
