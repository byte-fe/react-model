/// <reference path="./index.d.ts" />
import * as React from 'react'
import { PureComponent, useCallback, useEffect, useState } from 'react'
import produce from 'immer'
import { GlobalContext, Consumer } from './helper'

let GlobalState: any = {}
// Communicate between Provider-Consumer and Hooks
// Use to provide backwards-compatible.
let Setter = {
  classSetter: undefined as any,
  functionSetter: {} as any
}

let uid = Math.random() // The unique id of hooks

const Model = <M extends Models>(models: M) => {
  GlobalState = {
    ...models
  }
  return { useStore } as {
    useStore: <K extends keyof M>(
      name: K,
      models?: M
    ) => [Get<M[K], 'state'>, getConsumerActionsType<Get<M[K], 'actions'>>]
  }
}

const setPartialState = (
  name: keyof typeof GlobalState,
  partialState: typeof GlobalState | Function = {}
) => {
  if (typeof partialState === 'function') {
    let state = GlobalState[name].state
    state = produce(state, partialState)
    GlobalState = produce(GlobalState, s => {
      s[name].state = state
    })
  } else {
    GlobalState = produce(GlobalState, s => {
      s[name].state = {
        ...s[name].state,
        ...partialState
      }
    })
  }
  return GlobalState
}

const getState = (modelName: keyof typeof GlobalState) => {
  return (GlobalState as any)[modelName].state
}

// -- Middlewares --
const stateUpdater: Middleware = (context, restMiddlewares) => {
  const { setState, modelName, next } = context
  setState(GlobalState[modelName].state)
  next(restMiddlewares)
}

const communicator: Middleware<{}> = (context, restMiddlewares) => {
  const { modelName, next } = context
  Setter.classSetter && Setter.classSetter(GlobalState)
  Object.keys(Setter.functionSetter[modelName]).map(key =>
    Setter.functionSetter[modelName][key].setState(GlobalState[modelName].state)
  )
  next(restMiddlewares)
}

const tryCatch: Middleware<{}> = (context, restMiddlewares) => {
  const { next } = context
  next(restMiddlewares).catch((e: any) => console.log(e))
}

const getNewState: Middleware<{}> = async (context, restMiddlewares) => {
  const { action, modelName, consumerActions, params, next } = context
  context.newState = await action(
    GlobalState[modelName].state,
    consumerActions(GlobalState[modelName].actions),
    params
  )
  next(restMiddlewares)
}

const setNewState: Middleware<{}> = (context, restMiddlewares) => {
  const { modelName, newState, next } = context
  if (newState) {
    setPartialState(modelName, newState)
    next(restMiddlewares)
  }
}

const actionMiddlewares = [
  tryCatch,
  getNewState,
  setNewState,
  stateUpdater,
  communicator
]

const applyMiddlewares = (middlewares: Middleware[], context: Context) => {
  context.next = (restMiddlewares: Middleware[]) =>
    restMiddlewares.length > 0 &&
    restMiddlewares[0](context, restMiddlewares.slice(1))
  middlewares.length > 0 && middlewares[0](context, middlewares.slice(1))
}
// -----------

const useStore = (modelName: string) => {
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
  const consumerAction = (action: Action) => async (params: any) => {
    const context: Context = {
      modelName,
      setState,
      actionName: action.name,
      next: () => {},
      newState: null,
      params,
      consumerActions,
      action
    }
    applyMiddlewares(actionMiddlewares, context)
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
          const context: Context = {
            modelName,
            setState,
            actionName: key,
            next: () => {},
            newState: null,
            params,
            consumerActions,
            action: GlobalState[modelName].actions[key]
          }
          applyMiddlewares(actionMiddlewares, context)
        },
        []
        // [GlobalState[modelName]]
      ))
  )
  return [state, updaters]
}

// Bridge API
// Use to migrate from old class component.
// These APIs won't be updated for advance feature.
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
                Object.keys(Setter.functionSetter[modelName]).map(
                  key =>
                    Setter.functionSetter[modelName][key] &&
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

export { actionMiddlewares, Model, Provider, Consumer, connect, getState }
