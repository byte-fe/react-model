/// <reference path="../index.d.ts" />
process.env.NODE_ENV = 'production'
import { Model } from '../../src'
import { ErrorCounter } from '..'
import { renderHook } from '@testing-library/react-hooks'

describe('tryCatch', () => {
  test("catch actions' error in production", async () => {
    let actions: any
    let errNum = 0
    const { useStore } = Model({ ErrorCounter })
    renderHook(() => {
      ;[, actions] = useStore('ErrorCounter')
    })
    await actions.increment().catch(() => {
      errNum += 1
    })
    expect(errNum).toBe(0)
  })
})
