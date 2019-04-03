/// <reference path="./index.d.ts" />
import * as React from 'react'
import { PureComponent, useEffect, useState } from 'react'
import Global from './global'
import {
  Consumer,
  consumerActions,
  getInitialState,
  GlobalContext
} from './helper'
import { actionMiddlewares, applyMiddlewares, middlewares } from './middlewares'

const isModelType = (input: any): input is ModelType => {
  return (input as ModelType).state !== undefined
}

const isAPI = (input: any): input is API => {
  return (input as API).useStore !== undefined
}

function Model<MT extends ModelType>(models: MT): API<MT>
function Model<M extends Models>(
  models: M,
  initialState?: Global['State']
): APIs<M>
function Model<M extends Models, MT extends ModelType>(
  models: M | MT,
  initialState?: Global['State']
) {
  if (isModelType(models)) {
    const hash = '__' + Global.uid
    Global.State[hash] = models.state
    Global.Actions[hash] = models.actions
    Global.AsyncState[hash] = models.asyncState
    const actions = getActions(hash)
    return {
      __id: hash,
      actions,
      getState: getState(hash),
      subscribe: (
        actionName: keyof MT['actions'] | Array<keyof MT['actions']>,
        callback: () => void
      ) => subscribe(hash, actionName as (string | string[]), callback),
      unsubscribe: (
        actionName: keyof MT['actions'] | Array<keyof MT['actions']>
      ) => unsubscribe(hash, actionName as (string | string[])),
      useStore: (depActions?: Array<keyof MT['actions']>) =>
        useStore(hash, depActions as (string[] | undefined))
    }
  } else {
    if (initialState) {
      Global.State = initialState || {}
    }
    Object.entries(models).forEach(([name, model]) => {
      if (!isAPI(model)) {
        if (!Global.State[name]) {
          Global.State[name] = model.state
        }
        Global.Actions[name] = model.actions
        Global.AsyncState[name] = model.asyncState
      } else {
        if (!Global.State[name]) {
          Global.State[name] = Global.State[model.__id]
        }
        Global.Actions[name] = Global.Actions[model.__id]
        Global.AsyncState[name] = Global.AsyncState[model.__id]
      }
    })

    const actions = Object.keys(models).reduce(
      (o, modelName) => ({ ...o, name: getActions(modelName) }),
      {}
    )

    Global.withDevTools =
      typeof window !== 'undefined' &&
      (window as any).__REDUX_DEVTOOLS_EXTENSION__
    if (Global.withDevTools) {
      Global.devTools = (window as any).__REDUX_DEVTOOLS_EXTENSION__
      Global.devTools.connect()
    }
    return {
      actions,
      getActions,
      getInitialState,
      getState,
      subscribe,
      unsubscribe,
      useStore
    } as APIs<M>
  }
}

const unsubscribe = (modelName: string, actions: string | string[]) => {
  subscribe(modelName, actions, undefined)
}

const subscribe = (
  modelName: string,
  actions: string | string[],
  callback?: () => void
) => {
  if (Array.isArray(actions)) {
    actions.forEach(actionName => {
      if (!Global.subscriptions[`${modelName}_${actionName}`]) {
        Global.subscriptions[`${modelName}_${actionName}`] = []
      }
      if (callback) {
        Global.subscriptions[`${modelName}_${actionName}`].push(callback)
      } else {
        Global.subscriptions[`${modelName}_${actionName}`] = []
      }
    })
  } else {
    if (!Global.subscriptions[`${modelName}_${actions}`]) {
      Global.subscriptions[`${modelName}_${actions}`] = []
    }
    if (callback) {
      Global.subscriptions[`${modelName}_${actions}`].push(callback)
    } else {
      Global.subscriptions[`${modelName}_${actions}`] = []
    }
  }
}

const getState = (modelName: keyof typeof Global.State) => {
  return Global.State[modelName]
}

const getActions = (
  modelName: string,
  baseContext: Partial<Context> = { type: 'outer' }
) => {
  const updaters: any = {}
  Object.entries(Global.Actions[modelName]).forEach(
    ([key, action]) =>
      (updaters[key] = async (params: any, middlewareConfig?: any) => {
        const context: InnerContext = {
          action,
          actionName: key,
          consumerActions,
          middlewareConfig,
          modelName,
          newState: null,
          params,
          ...baseContext,
          Global
        }
        await applyMiddlewares(actionMiddlewares, context)
      })
  )
  return updaters
}

const useStore = (modelName: string, depActions?: string[]) => {
  const setState = useState(Global.State[modelName])[1]
  Global.uid += 1
  const hash = '' + Global.uid
  if (!Global.Setter.functionSetter[modelName]) {
    Global.Setter.functionSetter[modelName] = {}
  }
  Global.Setter.functionSetter[modelName][hash] = { setState, depActions }
  useEffect(() => {
    return function cleanup() {
      delete Global.Setter.functionSetter[modelName][hash]
    }
  })
  const updaters = getActions(modelName, { setState, type: 'function' })
  return [getState(modelName), updaters]
}

// Class API
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
