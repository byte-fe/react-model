/// <reference path="../index.d.ts" />
import { Model } from '../../src'
import { NextCounter } from '..'
import { renderHook } from '@testing-library/react-hooks'

describe('Subscribe middleware', () => {
  test('run callback when specific action run', async () => {
    let actions: any
    let count = 0
    let incrementCount = 0
    const Counter = Model(NextCounter)
    const { useStore, subscribe } = Model({ Counter })
    subscribe('Counter', ['increment'], () => (count += 1))
    subscribe('Counter', 'add', () => (count += 10))
    subscribe('Counter', ['increment', 'add'], () => (count += 5))
    subscribe('Counter', 'increment', ({ params }) => {
      incrementCount += params || 1
    })
    renderHook(() => {
      ;[, actions] = useStore('Counter')
    })
    await actions.increment()
    await actions.add(1)
    await actions.increment()
    await actions.increment()
    expect(count).toBe(33)
    await actions.addCaller()
    expect(count).toBe(48)
    expect(incrementCount).toBe(3)
    await actions.increment(10)
    expect(incrementCount).toBe(13)
    await actions.increment(-3)
    expect(incrementCount).toBe(10)
  })
})
