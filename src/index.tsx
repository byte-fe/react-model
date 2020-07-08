/// <reference path="./index.d.ts" />
import produce from 'immer'
import * as React from 'react'
import { PureComponent, useEffect, useState, useRef } from 'react'
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

function Model<E, Ctx extends {}, MT extends ModelType<any, any, {}>>(
  models: MT,
  // initialState represent extContext here
  initialState?: E
): API<MT>
function Model<M extends Models, E>(
  models: M,
  initialState?: Global['State']
): APIs<M>
function Model<M extends Models, MT extends ModelType, E>(
  models: M | MT,
  initialState?: Global['State'],
  extContext?: E
) {
  if (isModelType(models)) {
    Global.uid += 1
    const hash = '__' + Global.uid
    Global.State = produce(Global.State, (s) => {
      s[hash] = models.state
    })
    if (models.middlewares) {
      Global.Middlewares[hash] = models.middlewares
    }
    Global.Actions[hash] = models.actions
    Global.AsyncState[hash] = models.asyncState
    // initialState represent extContext here
    initialState && (Global.Context[hash] = initialState)
    const actions = getActions(hash)
    return {
      __id: hash,
      actions,
      getState: () => getState(hash),
      subscribe: (
        actionName: keyof MT['actions'] | Array<keyof MT['actions']>,
        callback: () => void
      ) => subscribe(hash, actionName as string | string[], callback),
      unsubscribe: (
        actionName: keyof MT['actions'] | Array<keyof MT['actions']>
      ) => unsubscribe(hash, actionName as string | string[]),
      useStore: (depActions?: Array<keyof MT['actions']>) =>
        useStore(hash, depActions as string[] | undefined)
    }
  } else {
    if (models.actions) {
      console.error('invalid model(s) schema: ', models)
      const errorFn = (fakeReturnVal?: unknown) => (..._: unknown[]) => {
        return fakeReturnVal
      }
      // Fallback Functions
      return {
        __ERROR__: true,
        actions: errorFn({}),
        getActions: errorFn({}),
        getInitialState: errorFn({}),
        getState: errorFn({}),
        subscribe: errorFn(),
        unsubscribe: errorFn(),
        useStore: errorFn([{}, {}])
      } as any
    }
    if (initialState && !initialState.__FROM_SERVER__) {
      Global.State = produce(Global.State, (s) => {
        Object.assign(s, initialState || {})
      })
    }
    extContext && (Global.Context['__global'] = extContext)
    Object.entries(models).forEach(([name, model]) => {
      if (model.__ERROR__) {
        // Fallback State and Actions when model schema is invalid
        console.error(name + " model's schema is invalid")
        Global.State = produce(Global.State, (s) => {
          s[name] = {}
        })
        Global.Actions[name] = {}
        return
      }
      if (!isAPI(model)) {
        if (initialState && initialState.__FROM_SERVER__) {
          Global.State = produce(Global.State, (s) => {
            s[name] = { ...model.state, ...initialState[name] }
          })
        } else if (!Global.State[name]) {
          Global.State = produce(Global.State, (s) => {
            s[name] = model.state
          })
        }
        if (model.middlewares) {
          Global.Middlewares[name] = model.middlewares
        }
        Global.Actions[name] = model.actions
        Global.AsyncState[name] = model.asyncState
      } else {
        // If you develop on SSR mode, hot reload will still keep the old Global reference, so initialState won't change unless you restart the dev server
        if (!Global.State[name] || !initialState) {
          Global.State = produce(Global.State, (s) => {
            s[name] = s[model.__id]
          })
        }
        if (initialState && initialState.__FROM_SERVER__) {
          Global.State = produce(Global.State, (s) => {
            s[name] = { ...s[model.__id], ...initialState[name] }
          })
        }
        Global.Actions[name] = Global.Actions[model.__id]
        Global.AsyncState[name] = Global.AsyncState[model.__id]
        Global.Middlewares[name] = Global.Middlewares[model.__id]
        Global.Context[name] = Global.Context[model.__id]
      }
    })

    const actions = Object.keys(models).reduce(
      (o, modelName) => ({ ...o, [modelName]: getActions(modelName) }),
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
    actions.forEach((actionName) => {
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
        if (Global.Middlewares[modelName]) {
          await applyMiddlewares(Global.Middlewares[modelName], context)
        } else {
          await applyMiddlewares(actionMiddlewares, context)
        }
      })
  )
  return updaters
}

const useStore = (modelName: string, depActions?: string[]) => {
  const setState = useState({})[1]
  const hash = useRef<string>('')

  useEffect(() => {
    Global.uid += 1
    const local_hash = '' + Global.uid
    hash.current = local_hash
    if (!Global.Setter.functionSetter[modelName]) {
      Global.Setter.functionSetter[modelName] = {}
    }
    Global.Setter.functionSetter[modelName][local_hash] = {
      setState,
      depActions
    }
    return function cleanup() {
      delete Global.Setter.functionSetter[modelName][local_hash]
    }
  }, [])

  const updaters = getActions(modelName, {
    __hash: hash.current,
    type: 'function'
  })
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
          {(models) => {
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
