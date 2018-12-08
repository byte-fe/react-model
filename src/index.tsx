/// <reference path="./index.d.ts" />
import * as React from 'react'
import {
  PureComponent,
  useCallback,
  // useContext,
  useEffect,
  useState
} from 'react'
import { GlobalContext, Consumer } from './helper'

let GlobalState: any = {}
// Communicate between Provider-Consumer and Hooks
// Use to provide backwards-compatible.
let Setter = {
  classSetter: undefined as any,
  functionSetter: {} as any
}

let uid = Math.random() // The unique id of hooks

const registerModel = (models: any) => {
  GlobalState = {
    ...models
  }
}

class Provider extends PureComponent<{}, ProviderProps> {
  state = GlobalState
  render() {
    const { children } = this.props
    Setter.classSetter = this.setState.bind(this)
    return (
      <GlobalContext.Provider
        value={{ ...GlobalState, setState: this.setState.bind(this) }}
      >
        {children}
      </GlobalContext.Provider>
    )
  }
}

const setPartialState = (name: keyof typeof GlobalState, partialState: any) => {
  GlobalState = {
    ...GlobalState,
    [name]: {
      actions: GlobalState[name].actions,
      state: {
        ...GlobalState[name].state,
        ...partialState
      }
    }
  }
  return GlobalState
}

const getState = (modelName: keyof typeof GlobalState) => {
  return (GlobalState as any)[modelName].state
}

const useStore = (modelName: keyof typeof GlobalState) => {
  // const _state = useContext(GlobalContext)
  const [state, setState] = useState(GlobalState[modelName].state)
  uid += 1
  const _hash = '' + uid
  if (!Setter.functionSetter[modelName]) Setter.functionSetter[modelName] = []
  Setter.functionSetter[modelName][_hash] = { setState }
  useEffect(() => {
    return function cleanup() {
      delete Setter.functionSetter[modelName][_hash]
    }
  })
  const updaters: any = {}
  const consumerAction = (action: any) => async (...params: any) => {
    const newState = await action(
      GlobalState[modelName].state,
      consumerActions(GlobalState[modelName].actions),
      ...params
    )
    if (newState) {
      setPartialState(modelName, newState)
      setState(GlobalState[modelName].state)
      Setter.classSetter(GlobalState)
      Object.keys(Setter.functionSetter[modelName]).map(key =>
        Setter.functionSetter[modelName][key].setState(
          GlobalState[modelName].state
        )
      )
    }
  }
  const consumerActions = (actions: any) => {
    let ret: any = {}
    Object.keys(actions).map((key: string) => {
      ret[key] = consumerAction(actions[key])
    })
    return ret
  }
  Object.keys(GlobalState[modelName].actions).map(
    key =>
      (updaters[key] = useCallback(
        async (params: any) => {
          const newState = await GlobalState[modelName].actions[key](
            GlobalState[modelName].state,
            consumerActions(GlobalState[modelName].actions),
            params
          )
          if (newState) {
            setPartialState(modelName, newState)
            setState(GlobalState[modelName].state)
            Setter.classSetter(GlobalState)
            Object.keys(Setter.functionSetter[modelName]).map(key =>
              Setter.functionSetter[modelName][key].setState(
                GlobalState[modelName].state
              )
            )
          }
        },
        []
        // [GlobalState[modelName]]
      ))
  )
  return [state, updaters]
}

const connect = (modelName: string, mapProps: Function | undefined) => (
  Component: typeof React.Component | typeof PureComponent
) =>
  class P extends PureComponent<{}> {
    render() {
      return (
        <Consumer>
          {models => {
            const {
              [`${modelName}`]: { state, actions },
              setState
            } = models as any
            const consumerAction = (action: any) => async (...params: any) => {
              const newState = await action(
                GlobalState[modelName].state,
                consumerActions(actions),
                ...params
              )
              if (newState) {
                setPartialState(modelName, newState)
                setState(GlobalState)
                Object.keys(Setter.functionSetter[modelName]).map(key =>
                  Setter.functionSetter[modelName][key].setState(
                    GlobalState[modelName].state
                  )
                )
              }
            }
            const consumerActions = (actions: any) => {
              let ret: any = {}
              Object.keys(actions).map((key: string) => {
                ret[key] = consumerAction(actions[key])
              })
              return ret
            }

            return (
              <Component
                state={mapProps ? mapProps(state) : state}
                actions={consumerActions(actions)}
              />
            )
          }}
        </Consumer>
      )
    }
  }

export { registerModel, Provider, Consumer, connect, useStore, getState }
