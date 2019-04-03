/// <reference path="../index.d.ts" />
import { AsyncCounter } from '..'
import { Model } from '../../src'

describe('useStore', () => {
  test('use initialModels', async () => {
    const { getInitialState } = Model({ AsyncCounter })
    const initialModels = await getInitialState()
    const { getState } = Model({ AsyncCounter }, initialModels)
    const state = getState('AsyncCounter')
    expect(state.count).toBe(1)
  })
})
