/// <reference path="../index.d.ts" />
import 'react-testing-library/cleanup-after-each'
process.env.NODE_ENV = 'production'
import { Model } from '../../src'
import { ErrorCounter } from '..'
import { testHook } from 'react-hooks-testing-library'

describe('tryCatch', () => {
  test("catch actions' error in production", async () => {
    let actions: any
    let errNum = 0
    const { useStore } = Model({ ErrorCounter })
    testHook(() => {
      ;[, actions] = useStore('ErrorCounter')
    })
    await actions.increment().catch(() => {
      errNum += 1
    })
    expect(errNum).toBe(0)
  })
})
