/// <reference path="./index.d.ts" />
import { testHook } from 'react-hooks-testing-library'
import { Model } from '../src'
import { Counter, AsyncCounter } from '.'

describe('useStore', () => {
  test('return default initial values', () => {
    let state
    const { useStore } = Model({ Counter })
    testHook(() => {
      ;[state] = useStore('Counter')
    })
    expect(state).toEqual({ count: 0 })
  })
  test('consumer actions return function', async () => {
    let state: any
    let actions: any
    const { useStore } = Model({ Counter })
    testHook(() => {
      ;[state, actions] = useStore('Counter')
    })
    await actions.increment(3)
    expect(state).toEqual({ count: 3 })
    await actions.increment(4)
    expect(state.count).toBe(7)
  })
  test('consumer actions return Partial<State>', async () => {
    let state: any
    let actions: any
    const { useStore } = Model({ Counter })
    testHook(() => {
      ;[state, actions] = useStore('Counter')
    })
    await actions.add(3)
    expect(state).toEqual({ count: 3 })
  })
  test('use initialModels', async () => {
    const { getInitialState } = Model({ AsyncCounter })
    const initialModels = await getInitialState()
    const { getState } = Model({ AsyncCounter }, initialModels)
    const state = getState('AsyncCounter')
    expect(state.count).toBe(1)
  })
})
