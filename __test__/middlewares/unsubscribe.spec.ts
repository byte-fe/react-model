/// <reference path="../index.d.ts" />
import { Model } from '../../src'
import { Counter } from '..'
import { renderHook } from '@testing-library/react-hooks'

describe('Subscribe middleware', () => {
  test('run callback when specific action run', async () => {
    let actions: any
    let count = 0
    const { useStore, subscribe, unsubscribe } = Model({ Counter })
    subscribe('Counter', ['increment'], () => (count += 1))
    subscribe('Counter', 'add', () => (count += 10))
    subscribe('Counter', ['increment', 'add'], () => (count += 5))
    renderHook(() => {
      ;[, actions] = useStore('Counter')
    })
    await actions.increment()
    unsubscribe('Counter', 'add')
    await actions.add(1)
    unsubscribe('Counter', ['add', 'increment'])
    await actions.increment()
    await actions.increment()
    expect(count).toBe(6)
  })
})
