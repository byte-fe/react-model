// @ts-ignore
console.group = undefined
/// <reference path="./index.d.ts" />
import 'react-testing-library/cleanup-after-each'
import { Model } from '../src'
import { Counter } from '.'
import { testHook } from 'react-hooks-testing-library'

describe('PubSub', () => {
  test('run callback when specific action run', async () => {
    let actions: any
    let count = 0
    const { useStore, subscribe } = Model({ Counter })
    subscribe('Counter', 'increment', () => (count += 1))
    subscribe('Counter', 'add', () => (count += 10))
    testHook(() => {
      ;[, actions] = useStore('Counter')
    })
    await actions.increment()
    await actions.add(1)
    await actions.increment()
    await actions.increment()
    expect(count).toBe(13)
  })
})
