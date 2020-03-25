/// <reference path="../index.d.ts" />
import { renderHook } from '@testing-library/react-hooks'
import { Model } from '../../src'
import { Counter } from '../'

describe('middleware: ', () => {
  test("actions' middlewareConfig", async () => {
    let state: any
    let actions: any
    const { useStore } = Model({ Counter })
    renderHook(() => {
      ;[state, actions] = useStore('Counter')
    })
    await actions.add(3, { params: 'user-custom-params' })
    expect(state).toEqual({ count: 3 })
  })
})
