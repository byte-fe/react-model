/// <reference path="../index.d.ts" />
import { renderHook } from '@testing-library/react-hooks'
import { State } from '..'
import { Model } from '../../src'

describe('common used case', () => {
  test('create by single model with common setState', async () => {
    let state: any
    let actions: any
    const { useStore, getState } = Model(State)
    renderHook(() => {
      ;[state, actions] = useStore()
    })
    expect(state).toEqual({ xxx: '', yyy: -1 })
    await actions.setState({ yyy: 3 })
    expect(state).toEqual({ xxx: '', yyy: 3 })
    // @ts-ignore
    await actions.setState(state => {
      state.yyy = 1
    })
    expect(state.yyy).toBe(1)
    expect(getState().xxx).toBe("")
    expect(getState().yyy).toBe(1)

    // BAD USE CASE
    // 1. use both return value and produce modifier
    // @ts-ignore
    await actions.setState((state) => {
      state.xxx = "xxx"
      return { yyy: 10 }
    })
    // nothing changed
    expect(state.yyy).toBe(1)
    expect(getState().xxx).toBe("")

    // 2. return partial value in produce func
    // @ts-ignore
    await actions.setState((state) => {
      return { yyy: 10 }
    })
    // key xxx will be dropped
    expect(state.yyy).toBe(10)
    expect(getState().xxx).toBe(undefined)

  })
})
