/// <reference path="../index.d.ts" />
import { renderHook } from '@testing-library/react-hooks'
import { ExtCounter } from '..'
import { Model } from '../../src'

describe('useStore', () => {
  test('models with extContext', async () => {
    // Single Model extContext
    let state: any
    let actions: any
    const { useStore: u } = Model(ExtCounter, { name: 'test' })
    renderHook(() => {
      ;[state, actions] = u()
    })
    expect(state).toEqual({ name: '' })
    await actions.ext()
    expect(state).toEqual({ name: 'test' })
  })
})
