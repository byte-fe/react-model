import produce from 'immer'
import { createContext } from 'react'
import Global from './global'
import { actionMiddlewares, applyMiddlewares } from './middlewares'

const initialProviderState: Global['State'] = {}
const GlobalContext = createContext(initialProviderState)
const Consumer = GlobalContext.Consumer

// console.group polyfill
if (!console.group) {
  const groups: any[] = []
  const hr = '-'.repeat(80) // 80 dashes row line
  console.group = function logGroupStart(label: any) {
    groups.push(label)
    console.log('%c \nBEGIN GROUP: %c', hr, label)
    console.groupEnd = function logGroupEnd() {
      console.log('END GROUP: %c\n%c', groups.pop(), hr)
    }
  }
}

const consumerAction = (
  action: Action,
  modelContext: { modelName: string }
) => async (params: any, middlewareConfig?: any) => {
  const context: InnerContext = {
    Global,
    action,
    actionName: action.name,
    consumerActions,
    middlewareConfig,
    modelName: modelContext.modelName,
    newState: null,
    params,
    type: 'o'
  }
  return await applyMiddlewares(actionMiddlewares, context)
}

const consumerActions = (
  actions: Actions,
  modelContext: { modelName: string }
) => {
  const ret: any = {}
  Object.keys(actions).forEach((key) => {
    // @ts-ignore
    ret[key] = consumerAction(actions[key], modelContext)
  })
  return ret
}

const setPartialState = (
  name: keyof typeof Global['State'],
  partialState:
    | typeof Global['State']
    | ((state: typeof Global['State']['name']) => void)
) => {
  if (typeof partialState === 'function') {
    let state = Global.State[name]
    state = produce(state, partialState)
    Global.State = produce(Global.State, (s) => {
      s[name] = state
    })
  } else {
    Global.State = produce(Global.State, (s) => {
      s[name] = {
        ...s[name],
        ...partialState
      }
    })
  }
  return Global.State
}

const get = <T>(p: Array<string | number>) => (o: T) =>
  p.reduce((xs: any, key) => (xs && xs[key] ? xs[key] : null), o)

const timeout = <T>(ms: number, data: T): Promise<T> =>
  new Promise((resolve) =>
    setTimeout(() => {
      console.log(ms)
      resolve(data)
    }, ms)
  )

const getInitialState = async <T extends { modelName: string | string[] }>(
  context?: T,
  config?: { isServer?: boolean; prefix?: string }
) => {
  const ServerState: { [name: string]: any } = { __FROM_SERVER__: true }
  await Promise.all(
    Object.keys(Global.State).map(async (modelName) => {
      let prefix = (config && config.prefix) || ''
      if (
        !context ||
        !context.modelName ||
        modelName === prefix + context.modelName ||
        context.modelName.indexOf(prefix + modelName) !== -1
      ) {
        const asyncGetter = Global.AsyncState[modelName]
        const asyncState = asyncGetter ? await asyncGetter(context) : {}
        if (config && config.isServer) {
          ServerState[modelName] = asyncState
        } else {
          Global.State = produce(Global.State, (s) => {
            s[modelName] = { ...s[modelName], ...asyncState }
          })
        }
      }
    })
  )
  return config && config.isServer ? ServerState : Global.State
}

const getCache = (modelName: string, actionName: string) => {
  const JSONString = localStorage.getItem(
    `__REACT_MODELX__${modelName}_${actionName}`
  )
  return JSONString ? JSON.parse(JSONString) : null
}

const shallowEqual = (objA: any, objB: any) => {
  if (objA === objB) return true
  if (
    typeof objA !== 'object' ||
    objA === null ||
    typeof objB !== 'object' ||
    objB === null
  ) {
    return false
  }
  const keysA = Object.keys(objA)
  const keysB = Object.keys(objB)

  if (keysA.length !== keysB.length) return false

  for (let i = 0; i < keysA.length; i++) {
    if (
      !Object.prototype.hasOwnProperty.call(objB, keysA[i]) ||
      objA[keysA[i]] !== objB[keysA[i]]
    ) {
      return false
    }
  }

  return true
}

export {
  Consumer,
  consumerActions,
  GlobalContext,
  setPartialState,
  shallowEqual,
  timeout,
  get,
  getCache,
  getInitialState
}
