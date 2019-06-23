/// <reference path="./index.d.ts" />
import { renderHook } from '@testing-library/react-hooks'
import { Counter } from '.'
import { Model } from '../src'

describe('useStore', () => {
  test('return default initial values', () => {
    let state
    const { useStore } = Model({ Counter })
    renderHook(() => {
      ;[state] = useStore('Counter')
    })
    expect(state).toEqual({ count: 0 })
  })
  test('consumer actions return function', async () => {
    let state: any
    let actions: any
    const { useStore, getActions } = Model({ Counter })
    renderHook(() => {
      ;[state] = useStore('Counter')
      actions = getActions('Counter')
    })
    await actions.increment(3)
    expect(state).toEqual({ count: 3 })
    await actions.increment(4)
    expect(state.count).toBe(7)
  })
})
