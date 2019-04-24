/// <reference path="./index.d.ts" />
/// <reference path="../src/index.d.ts" />
import { Model } from '../src'
import { timeout } from '../src/helper'
import { actionMiddlewares } from '../src/middlewares'

export const ActionsTester: ModelType<ActionTesterState, ActionTesterParams> = {
  state: {
    response: {
      data: {}
    },
    data: {}
  },
  actions: {
    get: async () => {
      const response = await timeout(9, { code: 0, data: { counter: 1000 } })
      return { response }
    },
    parse: () => {
      return state => {
        state.data = state.response.data
      }
    },
    getData: async (_, actions) => {
      await actions.get()
      actions.parse()
    }
  }
}

export const Counter: ModelType<
  CounterState,
  CounterActionParams & ExtraActionParams
> = {
  state: { count: 0 },
  actions: {
    increment: (_, __, params) => {
      return state => {
        state.count += params
      }
    },
    add: (state, __, params) => {
      return {
        count: state.count + params
      }
    }
  }
}

// v3.0
export const NextCounter: NextModelType<
  CounterState,
  CounterActionParams & ExtraActionParams
> = {
  state: { count: 0 },
  actions: {
    increment: params => {
      return state => {
        state.count += params
      }
    },
    add: (params, { state }) => {
      return {
        count: state.count + params
      }
    }
  }
}

export const Theme: ModelType<ThemeState, ThemeActionParams> = {
  state: {
    theme: 'dark'
  },
  actions: {
    changeTheme: state => ({
      theme: state.theme === 'dark' ? 'light' : 'dark'
    })
  }
}

export const AsyncCounter: ModelType<CounterState, CounterActionParams> = {
  state: { count: 0 },
  asyncState: async (context: { count?: number }) => ({
    count: context ? context.count || 1 : 1
  }),
  actions: {
    increment: (_, __, params) => {
      return state => {
        state.count += params
      }
    }
  }
}

export const AsyncNull: ModelType<CounterState, CounterActionParams> = {
  state: { count: 0 },
  actions: {
    increment: (_, __, params) => {
      return state => {
        state.count += params
      }
    }
  }
}

export const TimeoutCounter: ModelType<CounterState, CounterActionParams> = {
  state: { count: 0 },
  asyncState: async () => ({
    count: 1
  }),
  actions: {
    increment: async (_, __, params) => {
      await timeout(4000, {})
      return (state: typeof _) => {
        state.count += params
      }
    }
  }
}

export const ErrorCounter: ModelType<CounterState, CounterActionParams> = {
  state: { count: 0 },
  actions: {
    increment: async () => {
      throw 'error'
    }
  }
}

const delayMiddleware: Middleware = async (context, restMiddlewares) => {
  await timeout(2000, {})
  context.next(restMiddlewares)
}

const nextCounterModel: NextModelType<CounterState, NextCounterActionParams> = {
  actions: {
    add: num => {
      return state => {
        state.count += num
      }
    },
    increment: async (num, { actions }) => {
      actions.add(num)
      await timeout(300, {})
    }
  },
  middlewares: [delayMiddleware, ...actionMiddlewares],
  state: {
    count: 0
  }
}

export const NextCounterModel = Model(nextCounterModel)
