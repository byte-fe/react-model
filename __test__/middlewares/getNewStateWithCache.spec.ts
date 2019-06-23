/// <reference path="../index.d.ts" />
import { Model, middlewares, actionMiddlewares } from '../../src'
import { renderHook } from '@testing-library/react-hooks'
import { TimeoutCounter } from '..'

describe('getNewStateWithCache: ', () => {
  test('cache when timeout', async () => {
    let state: any, actions: any
    const cacheMiddlewareIndex = actionMiddlewares.indexOf(
      middlewares.getNewState
    )
    actionMiddlewares[cacheMiddlewareIndex] = middlewares.getNewStateWithCache(
      3000
    )
    const { useStore } = Model({ TimeoutCounter })
    renderHook(() => {
      ;[state, actions] = useStore('TimeoutCounter')
    })
    await actions.increment(3)
    expect(state).toEqual({ count: 0 })
  })
})
