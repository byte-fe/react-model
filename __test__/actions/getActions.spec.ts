/// <reference path="../index.d.ts" />
import { renderHook } from '@testing-library/react-hooks'
import { ActionsTester } from '../index'
import { Model } from '../../src'

describe('actions', () => {
  test('call actions in action', async () => {
    const { getActions, getState } = Model({ ActionsTester })
    let state: any
    let actions: any
    renderHook(() => {
      actions = getActions('ActionsTester')
    })
    await actions.getData()
    state = getState('ActionsTester')
    expect(state.data).toEqual({ counter: 1000 })
  })
})
