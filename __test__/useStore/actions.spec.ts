/// <reference path="../index.d.ts" />
import { renderHook } from '@testing-library/react-hooks'
import { Counter } from '..'
import { Model } from '../../src'

describe('useStore', () => {
  test('consumer actions return Partial<State>', async () => {
    let state: any
    let actions: any
    const { useStore } = Model({ Counter })
    renderHook(() => {
      ;[state, actions] = useStore('Counter')
    })
    await actions.add(3)
    expect(state).toEqual({ count: 3 })
  })
})
