import 'react-testing-library/cleanup-after-each'
import { Model } from '../src'
import { testHook } from 'react-testing-library'

type CounterState = {
  count: number
}

type CounterActionParams = {
  increment: number
}

const Counter: ModelType<CounterState, CounterActionParams> = {
  state: { count: 0 },
  actions: {
    increment: (_, __, params) => {
      return state => {
        state.count += params
      }
    }
  }
}

const { useStore } = Model({ Counter })

describe('useStore', () => {
  test('return default initial values', () => {
    let state
    testHook(() => {
      ;[state] = useStore('Counter')
    })
    expect(state).toEqual({ count: 0 })
  })
})
