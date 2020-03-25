/// <reference path="../index.d.ts" />
import { renderHook } from '@testing-library/react-hooks'
import { Model } from '../../src'
import { ActionsTester } from '../index'

describe('actions', () => {
  test('get actions from Model', async () => {
    const { actions, useStore } = Model({ ActionsTester })
    let state: any
    renderHook(() => {
      ;[state] = useStore('ActionsTester')
    })
    await actions.ActionsTester.getData()
    expect(state.data).toEqual({ counter: 1000 })
  })
})
