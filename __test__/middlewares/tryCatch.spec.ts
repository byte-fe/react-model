/// <reference path="../index.d.ts" />
process.env.NODE_ENV = 'production'
import { Model, middlewares } from '../../src'
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

  test("throw actions' error when turn off tryCatch middleware", async () => {
    let actions: any
    let errNum = 0
    middlewares.config.tryCatch.enable = false
    const { useStore } = Model({ ErrorCounter })
    renderHook(() => {
      ;[, actions] = useStore('ErrorCounter')
    })
    await actions.increment().catch(() => {
      errNum += 1
    })
    expect(errNum).toBe(1)
  })
})
