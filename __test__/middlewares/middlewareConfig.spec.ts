/// <reference path="../index.d.ts" />
import 'react-testing-library/cleanup-after-each'
import { testHook } from 'react-hooks-testing-library'
import { Model } from '../../src'
import { Counter } from '../'

describe('middleware: ', () => {
  test("actions' middlewareConfig", async () => {
    let state: any
    let actions: any
    const { useStore } = Model({ Counter })
    testHook(() => {
      ;[state, actions] = useStore('Counter')
    })
    await actions.add(3, { params: 'user-custom-params' })
    expect(state).toEqual({ count: 3 })
  })
})
