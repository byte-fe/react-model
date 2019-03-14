/// <reference path="../index.d.ts" />
import { Model, middlewares, actionMiddlewares } from '../../src'
import { testHook } from 'react-hooks-testing-library'
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
    testHook(() => {
      ;[state, actions] = useStore('TimeoutCounter')
    })
    await actions.increment(3)
    expect(state).toEqual({ count: 0 })
  })
})
