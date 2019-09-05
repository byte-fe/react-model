/// <reference path="../index.d.ts" />
import { renderHook } from '@testing-library/react-hooks'
import { ExtCounter } from '..'
import { Model } from '../../src'

describe('useStore', () => {
  test('models with extContext', async () => {
    // Multiple Model with Context
    let testState: any
    let testActions: any
    let extState: any
    let extActions: any
    const Test = Model(ExtCounter, { name: 'test' })
    const Ext = Model(ExtCounter, { name: 'ext' })
    const { useStore } = Model({ Test, Ext })
    renderHook(() => {
      ;[testState, testActions] = useStore('Test')
      ;[extState, extActions] = useStore('Ext')
    })
    expect(testState).toEqual({ name: '' })
    await testActions.ext()
    expect(testState).toEqual({ name: 'test' })
    expect(extState).toEqual({ name: '' })
    await extActions.ext()
    expect(extState).toEqual({ name: 'ext' })
  })
})
