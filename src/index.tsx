/// <reference path="./index.d.ts" />
import React, { PureComponent } from 'react'
import { GlobalContext, Consumer } from './helper'

let GlobalState: any = {}
let Setter = {
  classSetter: undefined as any,
  functionSetter: {} as any
}

// If get the Hooks Api from
// import {useState, useEffect, ...} from 'react'
// will throw Error Hooks can only be called inside the body of a function component
let hooksApi: any = {}

const registerModel = (models: any, hooks: any) => {
  GlobalState = {
    ...models
  }
  hooksApi = { ...hooks }
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
  console.log(
    Object.keys(Setter.functionSetter['Home']).length,
    Object.keys(Setter.functionSetter['Shared']).length
  )
  return GlobalState
}

const useStore = (modelName: keyof typeof GlobalState) => {
  // const _state = useContext(GlobalContext)
  console.log('useStore')
  const [state, setState] = hooksApi.useState(GlobalState[modelName].state)
  const _hash = new Date().toISOString() + Math.random()
  if (!Setter.functionSetter[modelName]) Setter.functionSetter[modelName] = []
  Setter.functionSetter[modelName][_hash] = { setState }
  hooksApi.useEffect(() => {
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
    setPartialState(modelName, newState)
    setState(GlobalState[modelName].state)
    Setter.classSetter(GlobalState)
    Object.keys(Setter.functionSetter[modelName]).map(key =>
      Setter.functionSetter[modelName][key].setState(
        GlobalState[modelName].state
      )
    )
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
      (updaters[key] = hooksApi.useCallback(
        async (params: any) => {
          const newState = await GlobalState[modelName].actions[key](
            GlobalState[modelName].state,
            consumerActions(GlobalState[modelName].actions),
            params
          )
          setPartialState(modelName, newState)
          setState(GlobalState[modelName].state)
          Setter.classSetter(GlobalState)
          Object.keys(Setter.functionSetter[modelName]).map(key =>
            Setter.functionSetter[modelName][key].setState(
              GlobalState[modelName].state
            )
          )
        },
        [GlobalState]
      ))
  )
  return [state, updaters]
  // return [state, setState]
}

const connect = (modelName: string, mapProps: Function) => (
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
              setPartialState(modelName, newState)
              setState(GlobalState)
              Object.keys(Setter.functionSetter[modelName]).map(key =>
                Setter.functionSetter[modelName][key].setState(
                  GlobalState[modelName].state
                )
              )
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
                state={mapProps(state)}
                actions={consumerActions(actions)}
              />
            )
          }}
        </Consumer>
      )
    }
  }

export { Provider, Consumer, connect, useStore, registerModel }
