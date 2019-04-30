/// <reference path="../index.d.ts" />
import 'react-testing-library/cleanup-after-each'
import { testHook } from 'react-hooks-testing-library'
import { ActionsTester } from '../index'
import { Model } from '../../src'

describe('actions', () => {
  test('call actions in action', async () => {
    const { useStore } = Model({ ActionsTester })
    let state: any
    let actions: any
    const { unmount } = testHook(() => {
      ;[state, actions] = useStore('ActionsTester')
    })
    await actions.getData()
    unmount()
    expect(state.data).toEqual({ counter: 1000 })
  })
})
