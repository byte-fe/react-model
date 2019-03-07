/// <reference path="../index.d.ts" />
import 'react-testing-library/cleanup-after-each'
import { testHook } from 'react-testing-library'
import { ActionsTester } from '../index'
import { Model } from '../../src'

describe('actions', () => {
  test('call actions in action', async () => {
    const { getActions, getState } = Model({ ActionsTester })
    let state: any
    let actions: any
    testHook(() => {
      actions = getActions('ActionsTester')
    })
    await actions.getData()
    state = getState('ActionsTester')
    expect(state.data).toEqual({ counter: 1000 })
  })
})
