/// <reference path="./index.d.ts" />
import * as React from 'react'
import Global from './global'
import { PureComponent, useEffect, useState } from 'react'
import { GlobalContext, Consumer, getInitialState } from './helper'
import { actionMiddlewares, applyMiddlewares, middlewares } from './middlewares'

// TODO: Cross Model communication

const Model = <M extends Models>(models: M, initialModels?: M) => {
  Global.State = initialModels
    ? Object.keys(models).reduce((o: any, key) => {
        o[key] = {
          actions: models[key].actions,
          state: { ...models[key].state, ...initialModels[key].state }
        }
        return o
      }, {})
    : {
        ...models
      }

  Global.withDevTools =
    typeof window !== 'undefined' &&
    (window as any).__REDUX_DEVTOOLS_EXTENSION__
  if (Global.withDevTools) {
    Global.devTools = (window as any).__REDUX_DEVTOOLS_EXTENSION__
    Global.devTools.connect()
  }
  return { useStore, getState, getInitialState } as {
    useStore: <K extends keyof M>(
      name: K,
      depActions?: (keyof Get<M[K], 'actions'>)[]
    ) => [Get<M[K], 'state'>, getConsumerActionsType<Get<M[K], 'actions'>>]
    getState: <K extends keyof M>(modelName: K) => Readonly<Get<M[K], 'state'>>
    getInitialState: typeof getInitialState
  }
}

const getState = (modelName: keyof typeof Global.State) => {
  return (Global.State as any)[modelName].state
}

const useStore = (modelName: string, depActions?: string[]) => {
  const setState = useState(Global.State[modelName].state)[1]
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
    const context: Context = {
      type: 'function',
      modelName,
      setState,
      actionName: action.name,
      next: () => {},
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
  Object.keys(Global.State[modelName].actions).map(
    key =>
      (updaters[key] = async (params: any, middlewareConfig?: any) => {
        const context: Context = {
          type: 'function',
          modelName,
          setState,
          actionName: key,
          next: () => {},
          newState: null,
          params,
          middlewareConfig,
          consumerActions,
          action: Global.State[modelName].actions[key]
        }
        await applyMiddlewares(actionMiddlewares, context)
      })
  )
  return [getState(modelName), updaters]
}

// Bridge API
// Use to migrate from old class component.
// These APIs won't be updated for advance feature.
class Provider extends PureComponent<{}, ProviderProps> {
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
            const {
              [`${modelName}`]: { state, actions },
              setState
            } = models as any
            const consumerAction = (action: Action) => async (
              params: any,
              middlewareConfig?: any
            ) => {
              const context: Context = {
                type: 'class',
                action,
                consumerActions,
                params,
                middlewareConfig,
                actionName: action.name,
                modelName,
                next: () => {},
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
