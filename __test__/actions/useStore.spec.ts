/// <reference path="../index.d.ts" />
import { renderHook } from '@testing-library/react-hooks'
import { ActionsTester } from '../index'
import { Model } from '../../src'

describe('actions', () => {
  test('call actions in action', async () => {
    const { useStore } = Model({ ActionsTester })
    let state: any
    let actions: any
    renderHook(() => {
      ;[state, actions] = useStore('ActionsTester')
    })
    await actions.getData()
    expect(state.data).toEqual({ counter: 1000 })
  })
})
