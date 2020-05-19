// @ts-ignore
/// <reference path="./index.d.ts" />
import { Model, middlewares } from '../src'
import { Counter } from '.'
import { renderHook } from '@testing-library/react-hooks'

middlewares.config.logger.enable = ({ actionName }) =>
  ['increment'].indexOf(actionName) !== -1

describe('PubSub', () => {
  test('run callback when specific action run', async () => {
    let actions: any
    let count = 0
    const { useStore, subscribe } = Model({ Counter })
    subscribe('Counter', 'increment', () => (count += 1))
    subscribe('Counter', 'add', () => (count += 10))
    renderHook(() => {
      ;[, actions] = useStore('Counter')
    })
    await actions.increment()
    await actions.add(1)
    await actions.increment()
    await actions.increment()
    expect(count).toBe(13)
  })
})
