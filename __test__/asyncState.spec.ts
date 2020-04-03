/// <reference path="./index.d.ts" />
import { Model } from '../src'
import { AsyncCounter, AsyncNull } from '.'

describe('asyncState', () => {
  test('asyncState accept context params with error modelName', async () => {
    const { getInitialState, getState } = Model({ AsyncCounter })
    await getInitialState({ count: 2, modelName: 'Async' })
    const state = getState('AsyncCounter')
    expect(state.count).toBe(0)
  })
  test('return default initial state from asyncState', async () => {
    const { getState, getInitialState } = Model({ AsyncCounter })
    await getInitialState()
    const state = getState('AsyncCounter')
    expect(state.count).toBe(1)
  })
  test('asyncState accept context params', async () => {
    const { getInitialState, getState } = Model({ AsyncCounter })
    await getInitialState({ count: 2 })
    const state = getState('AsyncCounter')
    expect(state.count).toBe(2)
  })
  test('asyncState accept context params with modelName', async () => {
    const { getInitialState, getState } = Model({ AsyncCounter })
    await getInitialState({ count: 3, modelName: 'AsyncCounter' })
    const state = getState('AsyncCounter')
    expect(state.count).toBe(3)
  })
  test('asyncState work without asyncState', async () => {
    const { getInitialState, getState } = Model({ AsyncNull })
    await getInitialState()
    const state = getState('AsyncNull')
    expect(state.count).toBe(0)
  })
})
