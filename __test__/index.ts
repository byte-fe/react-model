/// <reference path="./index.d.ts" />
import { timeout } from '../src/helper'

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
        count: state.count += params
      }
    }
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
