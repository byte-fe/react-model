/// <reference path="./index.d.ts" />
import * as React from 'react'
import Global from './global'
import { PureComponent, useEffect, useState } from 'react'
import { GlobalContext, Consumer, getInitialState } from './helper'
import { actionMiddlewares, applyMiddlewares, middlewares } from './middlewares'

const Model = <M extends Models>(models: M, initialState?: Global['State']) => {
  Global.State = initialState || {}
  Object.keys(models).forEach(name => {
    if (!Global.State[name]) {
      Global.State[name] = models[name].state
    }
    Global.Actions[name] = models[name].actions
    Global.AsyncState[name] = models[name].asyncState
  })

  Global.withDevTools =
    typeof window !== 'undefined' &&
    (window as any).__REDUX_DEVTOOLS_EXTENSION__
  if (Global.withDevTools) {
    Global.devTools = (window as any).__REDUX_DEVTOOLS_EXTENSION__
    Global.devTools.connect()
  }
  return { useStore, getState, getInitialState, getActions, subscribe } as {
    useStore: <K extends keyof M>(
      name: K,
      depActions?: (keyof Get<M[K], 'actions'>)[]
    ) => [Get<M[K], 'state'>, getConsumerActionsType<Get<M[K], 'actions'>>]
    getState: <K extends keyof M>(modelName: K) => Readonly<Get<M[K], 'state'>>
    getActions: <K extends keyof M>(
      modelName: K
    ) => Readonly<getConsumerActionsType<Get<M[K], 'actions'>>>
    getInitialState: typeof getInitialState
    subscribe: <K extends keyof M>(
      modelName: K,
      actionName: keyof Get<M[K], 'actions'> | keyof Get<M[K], 'actions'>,
      callback: Function
    ) => void
  }
}

const subscribe = (
  modelName: string,
  actionName: string,
  callback: Function
) => {
  Global.subscriptions[`${modelName}_${actionName}`] = callback
}

const getState = (modelName: keyof typeof Global.State) => {
  return Global.State[modelName]
}

const getActions = (modelName: string) => {
  const updaters: any = {}
  const consumerAction = (action: Action) => async (
    params: any,
    middlewareConfig?: any
  ) => {
    const context: OuterContext = {
      type: 'outer',
      modelName,
      actionName: action.name,
      newState: null,
      params,
      middlewareConfig,
      consumerActions,
      action
    }
    await applyMiddlewares(actionMiddlewares, context)
  }
  const consumerActions = (actions: any) => {
    let ret: any = {}
    Object.keys(actions).map((key: string) => {
      ret[key] = consumerAction(actions[key])
    })
    return ret
  }
  Object.keys(Global.Actions[modelName]).map(
    key =>
      (updaters[key] = async (params: any, middlewareConfig?: any) => {
        const context: InnerContext = {
          type: 'function',
          modelName,
          setState: () => {},
          actionName: key,
          newState: null,
          params,
          middlewareConfig,
          consumerActions,
          action: Global.Actions[modelName][key]
        }
        await applyMiddlewares(actionMiddlewares, context)
      })
  )
  return updaters
}

const useStore = (modelName: string, depActions?: string[]) => {
  const setState = useState(Global.State[modelName])[1]
  Global.uid += 1
  const _hash = '' + Global.uid
  if (!Global.Setter.functionSetter[modelName])
    Global.Setter.functionSetter[modelName] = {}
  Global.Setter.functionSetter[modelName][_hash] = { setState, depActions }
  useEffect(() => {
    return function cleanup() {
      delete Global.Setter.functionSetter[modelName][_hash]
    }
  })
  const updaters: any = {}
  const consumerAction = (action: Action) => async (
    params: any,
    middlewareConfig?: any
  ) => {
    const context: InnerContext = {
      type: 'function',
      modelName,
      setState,
      actionName: action.name,
      newState: null,
      params,
      middlewareConfig,
      consumerActions,
      action
    }
    await applyMiddlewares(actionMiddlewares, context)
  }
  const consumerActions = (actions: any) => {
    let ret: any = {}
    Object.keys(actions).map((key: string) => {
      ret[key] = consumerAction(actions[key])
    })
    return ret
  }
  Object.keys(Global.Actions[modelName]).map(
    key =>
      (updaters[key] = async (params: any, middlewareConfig?: any) => {
        const context: InnerContext = {
          type: 'function',
          modelName,
          setState,
          actionName: key,
          newState: null,
          params,
          middlewareConfig,
          consumerActions,
          action: Global.Actions[modelName][key]
        }
        await applyMiddlewares(actionMiddlewares, context)
      })
  )
  return [getState(modelName), updaters]
}

// Bridge API
// Use to migrate from old class component.
// These APIs won't be updated for advance feature.
class Provider extends PureComponent<{}, Global['State']> {
  state = Global.State
  render() {
    const { children } = this.props
    Global.Setter.classSetter = this.setState.bind(this)
    return (
      <GlobalContext.Provider
        value={{ ...this.state, setState: this.setState.bind(this) }}
      >
        {children}
      </GlobalContext.Provider>
    )
  }
}

const connect = (
  modelName: string,
  mapState?: Function | undefined,
  mapActions?: Function | undefined
) => (Component: typeof React.Component | typeof PureComponent) =>
  class P extends PureComponent<any> {
    render() {
      const { state: prevState = {}, actions: prevActions = {} } = this.props
      return (
        <Consumer>
          {models => {
            const { [`${modelName}`]: state, setState } = models as any
            const actions = Global.Actions[modelName]
            const consumerAction = (action: Action) => async (
              params: any,
              middlewareConfig?: any
            ) => {
              const context: InnerContext = {
                type: 'class',
                action,
                consumerActions,
                params,
                middlewareConfig,
                actionName: action.name,
                modelName,
                newState: null,
                setState
              }
              await applyMiddlewares(actionMiddlewares, context)
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
                {...this.props}
                state={{
                  ...prevState,
                  ...(mapState ? mapState(state) : state)
                }}
                actions={{
                  ...prevActions,
                  ...(mapActions
                    ? mapActions(consumerActions(actions))
                    : consumerActions(actions))
                }}
              />
            )
          }}
        </Consumer>
      )
    }
  }

export {
  actionMiddlewares,
  Model,
  middlewares,
  Provider,
  Consumer,
  connect,
  getState,
  getInitialState
}
