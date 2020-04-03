/// <reference path="../index.d.ts" />
import { Model } from '../../src'
import { SSRCounter } from '..'

describe('asyncState', () => {
  test('return default initial state from asyncState', async () => {
    const { getInitialState } = Model({
      WrappedSSRCounter: Model(SSRCounter),
      SSRCounter
    })
    const initialModels = await getInitialState(undefined, { isServer: true })
    // const state = getState('AsyncCounter')
    expect(initialModels['SSRCounter'].count).toBe(1)
    expect(initialModels['SSRCounter'].clientKey).toBe(undefined)
    expect(initialModels['WrappedSSRCounter'].count).toBe(1)
    expect(initialModels['WrappedSSRCounter'].clientKey).toBe(undefined)

    // Simulate Client Side
    const { getState } = Model(
      { WrappedSSRCounter: Model(SSRCounter), SSRCounter },
      initialModels
    )
    expect(initialModels['SSRCounter'].count).toBe(1)
    expect(initialModels['WrappedSSRCounter'].count).toBe(1)
    expect(getState('SSRCounter').clientKey).toBe('unused')
    expect(getState('WrappedSSRCounter').clientKey).toBe('unused')
  })
})
