/// <reference path="./index.d.ts" />
import { Model } from '../src'
import { AsyncCounter } from '.'

describe('asyncState', () => {
  test('return default initial state from asyncState', async () => {
    const { getState, getInitialState } = Model({ AsyncCounter })
    await getInitialState()
    const state = getState('AsyncCounter')
    expect(state.count).toBe(1)
  })
})
