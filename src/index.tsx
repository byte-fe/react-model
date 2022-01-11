// need to remove types: ./src/index before running `yarn build` command
/// <reference path="./index.d.ts" />
import produce, { enableES5 } from 'immer'
enableES5()
import * as React from 'react'
import {
  PureComponent,
  useLayoutEffect,
  useEffect,
  useState,
  useRef
} from 'react'
import Global from './global'
import {
  Consumer,
  consumerActions,
  get,
  getInitialState,
  GlobalContext
} from './helper'
import { actionMiddlewares, applyMiddlewares, middlewares } from './middlewares'

const useStoreEffect =
  typeof window === 'undefined' ? useEffect : useLayoutEffect

const isModelType = (input: any): input is ModelType => {
  return (input as ModelType).state !== undefined
}

const isAPI = (input: any): input is API => {
  return (input as API).useStore !== undefined
}

// useModel rules:
// DON'T USE useModel OUTSIDE createStore func
function useModel<S>(
  state: S | (() => S)
): [S, (state: Partial<S> | ((state: S) => S | void)) => void] {
  const storeId = Global.currentStoreId
  const index = Global.mutableState[storeId].count
  Global.mutableState[storeId].count += 1
  if (!Global.mutableState[storeId].hasOwnProperty(index)) {
    if (typeof state === 'function') {
      // @ts-ignore
      Global.mutableState[storeId][index] = state()
    } else {
      Global.mutableState[storeId][index] = state
    }
  }

  const setter = async (state: Partial<S> | ((prevState: S) => S | void)) => {
    if (typeof state === 'function') {
      Global.mutableState[storeId][index] = produce(
        Global.mutableState[storeId][index],
        // @ts-ignore
        state
      )
    } else {
      if (
        Global.mutableState[storeId][index] &&
        state &&
        Global.mutableState[storeId][index].constructor.name === 'Object' &&
        state.constructor.name === 'Object'
      ) {
        Global.mutableState[storeId][index] = {
          ...Global.mutableState[storeId][index],
          ...state
        }
      } else {
        Global.mutableState[storeId][index] = state
      }
    }

    const context: InnerContext = {
      Global,
      action: () => {
        return typeof state === 'function'
          ? // @ts-ignore
            Global.mutableState[storeId][index]
          : state
      },
      actionName: 'setter',
      consumerActions,
      disableSelectorUpdate: true,
      middlewareConfig: {},
      modelName: storeId,
      newState: {},
      params: undefined,
      type: 'u'
    }

    // pass update event to other components subscribe the same store
    return await applyMiddlewares(actionMiddlewares, context)
  }
  return [Global.mutableState[storeId][index], setter]
}

function createStore<S>(useHook: CustomModelHook<S>): LaneAPI<S>
function createStore<S>(name: string, useHook: CustomModelHook<S>): LaneAPI<S>
function createStore<S>(n: any, u?: any): LaneAPI<S> {
  const hasName = typeof n === 'string'
  Global.storeId += hasName ? 0 : 1
  const storeId = hasName ? n : Global.storeId.toString()
  if (!Global.Actions[storeId]) {
    Global.Actions[storeId] = {}
  }
  if (!Global.mutableState[storeId]) {
    Global.mutableState[storeId] = { count: 0 }
  }
  // Global.currentStoreId = storeId
  // const state = useHook()
  // Global.State = produce(Global.State, (s) => {
  //   s[hash] = state
  // })
  const selector = () => {
    Global.mutableState[storeId].count = 0
    Global.currentStoreId = storeId
    const res = u ? u() : n()
    return res
  }
  Global.mutableState[storeId].selector = selector
  return {
    // TODO: support selector
    useStore: () => useStore(storeId, selector),
    getState: () => selector(),
    subscribe: (callback: () => void) => {
      if (!Global.subscriptions[storeId]) {
        Global.subscriptions[storeId] = []
      }
      Global.subscriptions[storeId].push(callback)
    },
    unsubscribe: (callback?: () => void) => {
      if (Global.subscriptions[storeId]) {
        if (callback) {
          const idx = Global.subscriptions[storeId].indexOf(callback)
          if (idx >= 0) Global.subscriptions[storeId].splice(idx, 1)
        }
      }
    }
  }
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
    Global.storeId += 1
    const hash = '__' + Global.storeId
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
      useStore: (selector?: Function) => useStore(hash, selector)
    }
  } else {
    if (initialState) {
      // TODO: support multi model group under SSR
      Global.gid = 1
    } else {
      Global.gid += 1
    }
    let prefix = ''
    if (Global.gid > 1) {
      prefix = Global.gid + '_'
    }
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
    let actions: { [name: string]: any } = {}
    Object.keys(models).forEach((n) => {
      let name = prefix + n
      const model = models[n]
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

      actions[n] = getActions(name)
    })

    return {
      actions,
      getActions: (name: string) => getActions(prefix + name),
      getInitialState: async <T extends { modelName: string | string[] }>(
        context?: T,
        config?: { isServer?: boolean }
      ) => getInitialState(context, { ...config, prefix }),
      getState: (name: string) => getState(prefix + name),
      subscribe: (
        name: string,
        actions: keyof MT['actions'] | Array<keyof MT['actions']>,
        callback: () => void
      ) => subscribe(prefix + name, actions as string | string[], callback),
      unsubscribe: (
        name: string,
        actionName: keyof MT['actions'] | Array<keyof MT['actions']>
      ) => unsubscribe(prefix + name, actionName as string | string[]),
      useStore: (name: string, selector?: Function) =>
        useStore(prefix + name, selector)
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
  baseContext: Partial<Context> = { type: 'o' }
) => {
  const updaters: any = {}
  Object.keys(Global.Actions[modelName]).forEach(
    (key) =>
      (updaters[key] = async (params: any, middlewareConfig?: any) => {
        const context: InnerContext = {
          action: Global.Actions[modelName][key],
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
          return await applyMiddlewares(Global.Middlewares[modelName], context)
        } else {
          return await applyMiddlewares(actionMiddlewares, context)
        }
      })
  )
  return updaters
}

const useStore = (modelName: string, selector?: Function) => {
  const setState = useState({})[1]
  const hash = useRef<string>('')
  // createStore('xxx', () => {}) has the top priority

  const mutableState = get([modelName])(Global.mutableState)
  const isFromCreateStore = !!mutableState
  const usedSelector = isFromCreateStore ? mutableState.selector : selector
  const usedState = isFromCreateStore ? mutableState : getState(modelName)

  useStoreEffect(() => {
    Global.uid += 1
    const local_hash = '' + Global.uid
    hash.current = local_hash
    if (!Global.Setter.functionSetter[modelName]) {
      Global.Setter.functionSetter[modelName] = {}
    }
    Global.Setter.functionSetter[modelName][local_hash] = {
      setState,
      selector: usedSelector
    }
    return function cleanup() {
      delete Global.Setter.functionSetter[modelName][local_hash]
    }
  }, [])

  if (isFromCreateStore) {
    return usedSelector(usedState)
  } else {
    const updaters = getActions(modelName, {
      __hash: hash.current,
      type: 'f'
    })
    return [usedSelector ? usedSelector(usedState) : usedState, updaters]
  }
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
  createStore,
  useModel,
  Model,
  middlewares,
  Provider,
  Consumer,
  connect,
  getState,
  getInitialState
}
