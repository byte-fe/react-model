/// <reference path="../index.d.ts" />
import { renderHook, act } from '@testing-library/react-hooks'
import { RetTester } from '..'
import { Model } from '../../src'

describe('action return value', () => {
  test('return object value', async () => {
    let actions: any
    const { useStore } = Model(RetTester)
    renderHook(() => {
      ;[, actions] = useStore()
    })
    await act(async () => {
      const retVal = await actions.add(5)
      expect(retVal).toEqual({ count: 5 })
      const retVal_2 = await actions.add(5)
      expect(retVal).toEqual({ count: 5 })
      expect(retVal_2).toEqual({ count: 10 })
    })
  })

  test('return promise value', async () => {
    let actions: any
    const { useStore } = Model(RetTester)
    renderHook(() => {
      ;[, actions] = useStore()
    })
    await act(async () => {
      const retVal = await actions.asyncAdd(5)
      expect(retVal).toEqual({ count: 5 })
      const retVal_2 = await actions.asyncAdd(5)
      expect(retVal).toEqual({ count: 5 })
      expect(retVal_2).toEqual({ count: 10 })
    })
  })

  test('return produce function', async () => {
    const asyncPrototype = Object.getPrototypeOf(async () => {})
    const isAsync = (input: unknown) => {
      return Object.getPrototypeOf(input) === asyncPrototype
    }
    let actions: any
    const { useStore } = Model(RetTester)
    renderHook(() => {
      ;[, actions] = useStore()
    })
    await act(async () => {
      const retVal = await actions.produceAdd(5)
      expect(isAsync(retVal)).toBe(true)
      const retVal_2 = await actions.produceAdd(5)
      expect(isAsync(retVal)).toBe(true)
      expect(isAsync(retVal_2)).toBe(true)
    })
  })

  test('return async produce function', async () => {
    const asyncPrototype = Object.getPrototypeOf(async () => {})
    const isAsync = (input: unknown) => {
      return Object.getPrototypeOf(input) === asyncPrototype
    }
    let actions: any
    const { useStore } = Model(RetTester)
    renderHook(() => {
      ;[, actions] = useStore()
    })
    await act(async () => {
      const retVal = await actions.asyncProduceAdd(5)
      expect(isAsync(retVal)).toBe(true)
      const retVal_2 = await actions.asyncProduceAdd(5)
      expect(isAsync(retVal)).toBe(true)
      expect(isAsync(retVal_2)).toBe(true)
    })
  })

  test('return action', async () => {
    let actions: any
    const { useStore } = Model(RetTester)
    renderHook(() => {
      ;[, actions] = useStore()
    })
    await act(async () => {
      const retVal = await actions.hocAdd(5)
      expect(retVal).toEqual({ count: 5 })
      const retVal_2 = await actions.hocAdd(5)
      expect(retVal).toEqual({ count: 5 })
      expect(retVal_2).toEqual({ count: 10 })
    })
  })

  test('return async action', async () => {
    let actions: any
    const { useStore } = Model(RetTester)
    renderHook(() => {
      ;[, actions] = useStore()
    })
    await act(async () => {
      const retVal = await actions.asyncHocAdd(5)
      expect(retVal).toEqual({ count: 5 })
      const retVal_2 = await actions.asyncHocAdd(5)
      expect(retVal).toEqual({ count: 5 })
      expect(retVal_2).toEqual({ count: 10 })
    })
  })
})
