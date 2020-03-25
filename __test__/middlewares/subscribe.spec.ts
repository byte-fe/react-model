/// <reference path="../index.d.ts" />
import { Model } from '../../src'
import { NextCounter } from '..'
import { renderHook } from '@testing-library/react-hooks'

describe('Subscribe middleware', () => {
  test('run callback when specific action run', async () => {
    let actions: any
    let count = 0
    const Counter = Model(NextCounter)
    const { useStore, subscribe } = Model({ Counter })
    subscribe('Counter', ['increment'], () => (count += 1))
    subscribe('Counter', 'add', () => (count += 10))
    subscribe('Counter', ['increment', 'add'], () => (count += 5))
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
  })
})
