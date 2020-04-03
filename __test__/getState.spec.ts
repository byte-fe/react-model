/// <reference path="./index.d.ts" />
import { Model } from '../src'
import { Counter } from '.'

describe('getState', () => {
  test('return default initial state', () => {
    let state
    const { getState } = Model({ Counter })
    state = getState('Counter')
    expect(state.count).toBe(0)
  })
})
