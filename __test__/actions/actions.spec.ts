/// <reference path="../index.d.ts" />
import { testHook } from 'react-hooks-testing-library'
import 'react-testing-library/cleanup-after-each'
import { Model } from '../../src'
import { ActionsTester } from '../index'

describe('actions', () => {
  test('get actions from Model', async () => {
    const { actions, useStore } = Model({ ActionsTester })
    let state: any
    testHook(() => {
      ;[state] = useStore('ActionsTester')
    })
    await actions.ActionsTester.getData()
    expect(state.data).toEqual({ counter: 1000 })
  })
})
