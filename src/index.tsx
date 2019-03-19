/// <reference path="./index.d.ts" />
import * as React from 'react'
import Global from './global'
import { PureComponent, useEffect, useState } from 'react'
import {
  GlobalContext,
  Consumer,
  getInitialState,
  consumerActions
} from './helper'
import { actionMiddlewares, applyMiddlewares, middlewares } from './middlewares'

const Model = <M extends Models>(models: M, initialState?: Global['State']) => {
  Global.State = initialState || {}
  Object.entries(models).forEach(([name, model]) => {
    if (!Global.State[name]) {
      Global.State[name] = model.state
    }
    Global.Actions[name] = model.actions
    Global.AsyncState[name] = model.asyncState
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

const getActions = (modelName: string, baseContext: Partial<Context>) => {
  const updaters: any = {}
  Object.entries(Global.Actions[modelName]).forEach(
    ([key, action]) =>
      (updaters[key] = async (params: any, middlewareConfig?: any) => {
        const context: InnerContext = {
          modelName,
          actionName: key,
          newState: null,
          params,
          middlewareConfig,
          consumerActions,
          action: action,
          Global,
          ...baseContext
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
  const updaters = getActions(modelName, { setState, type: 'function' })
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
      <GlobalContext.Provider value={{ ...this.state }}>
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
            const { [`${modelName}`]: state } = models as any
            const actions = Global.Actions[modelName]
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
                    ? mapActions(consumerActions(actions, { modelName }))
                    : consumerActions(actions, { modelName }))
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
