import { getCache, setPartialState, timeout, shallowEqual } from './helper'
// -- Middlewares --

const config: MiddlewareConfig = {
  logger: {
    enable: process.env.NODE_ENV !== 'production'
  },
  devtools: {
    enable: process.env.NODE_ENV !== 'production'
  },
  tryCatch: {
    enable: process.env.NODE_ENV === 'production'
  }
}

const tryCatch: Middleware = async (context, restMiddlewares) => {
  const { next } = context
  if (config.tryCatch.enable) {
    return await next(restMiddlewares).catch((e: any) => console.log(e))
  } else {
    return await next(restMiddlewares)
  }
}

const getNewState: Middleware = async (context, restMiddlewares) => {
  const {
    action,
    modelName,
    consumerActions,
    params,
    next,
    Global,
    type
  } = context
  if (type === 'u') {
    // @ts-ignore
    context.newState = action()
  } else {
    context.newState =
      (await action(params, {
        actions: consumerActions(Global.Actions[modelName], { modelName }),
        state: Global.State[modelName],
        ...(Global.Context['__global'] || {}),
        ...(Global.Context[modelName] || {})
      })) || null
  }

  return await next(restMiddlewares)
}

const getNewStateWithCache = (maxTime: number = 5000): Middleware => async (
  context,
  restMiddlewares
) => {
  const {
    action,
    Global,
    modelName,
    consumerActions,
    params,
    next,
    actionName
  } = context
  context.newState =
    (await Promise.race([
      action(params, {
        actions: consumerActions(Global.Actions[modelName], { modelName }),
        state: Global.State[modelName]
      }),
      timeout(maxTime, getCache(modelName, actionName))
    ])) || null
  return await next(restMiddlewares)
}

const setNewState: Middleware = async (context, restMiddlewares) => {
  const {
    modelName,
    newState,
    next,
    Global,
    disableSelectorUpdate,
    type
  } = context
  if (Global.Setter.functionSetter[modelName] && !disableSelectorUpdate) {
    Object.keys(Global.Setter.functionSetter[modelName]).map((key) => {
      const setter = Global.Setter.functionSetter[modelName][key]
      if (setter) {
        if (setter.selector && !setter.selectorRef) {
          setter.selectorRef = setter.selector(Global.State[modelName])
        }
      }
    })
  }
  if (newState || type === 'u') {
    setPartialState(modelName, newState || {})
    return await next(restMiddlewares)
  }
}

const stateUpdater: Middleware = async (context, restMiddlewares) => {
  const { modelName, next, Global, __hash } = context
  const setter = Global.Setter.functionSetter[modelName]
  if (
    context.type === 'f' &&
    __hash &&
    setter &&
    setter[__hash] &&
    setter[__hash].setState
  ) {
    setter[__hash].setState(Global.State[modelName])
  }
  return await next(restMiddlewares)
}

const subscription: Middleware = async (context, restMiddlewares) => {
  const { modelName, actionName, next, Global } = context
  const subscriptions =
    context.type === 'u'
      ? Global.subscriptions[modelName]
      : Global.subscriptions[`${modelName}_${actionName}`]
  if (subscriptions) {
    subscriptions.forEach((callback) => {
      callback(context)
    })
  }
  return await next(restMiddlewares)
}

const consoleDebugger: Middleware = async (context, restMiddlewares) => {
  const { Global } = context

  if (
    config.logger.enable === true ||
    (typeof config.logger.enable === 'function' &&
      config.logger.enable(context))
  ) {
    console.group(
      `%c ${
        context.modelName
      } State Change %c ${new Date().toLocaleTimeString()}`,
      'color: gray; font-weight: lighter;',
      'color: black; font-weight: bold;'
    )
    console.log(
      '%c Previous',
      `color: #9E9E9E; font-weight: bold`,
      Global.State[context.modelName]
    )
    console.log(
      '%c Action',
      `color: #03A9F4; font-weight: bold`,
      context.actionName,
      `payload: ${context.params}`
    )
    const ret = await context.next(restMiddlewares)
    console.log(
      '%c Next',
      `color: #4CAF50; font-weight: bold`,
      Global.State[context.modelName]
    )
    console.groupEnd()
    return ret
  } else {
    return await context.next(restMiddlewares)
  }
}

const devToolsListener: Middleware = async (context, restMiddlewares) => {
  const { Global } = context
  const ret = await context.next(restMiddlewares)
  Global.withDevTools =
    typeof window !== 'undefined' &&
    (window as any).__REDUX_DEVTOOLS_EXTENSION__
  if (
    Global.withDevTools &&
    middlewares.config.devtools.enable &&
    !Global.devTools
  ) {
    Global.devTools = (window as any).__REDUX_DEVTOOLS_EXTENSION__
    Global.devTools.connect()
  }
  if (Global.withDevTools && config.devtools.enable) {
    const actionName =
      context.type === 'u' && context.disableSelectorUpdate
        ? `store[${context.modelName}].update`
        : `${context.modelName}_${context.actionName}`
    Global.devTools.send(
      actionName,
      Global.mutableState[context.modelName],
      undefined,
      context.modelName
    )
  }
  return ret
}

const communicator: Middleware = async (context, restMiddlewares) => {
  const { modelName, next, Global, disableSelectorUpdate } = context
  if (Global.Setter.classSetter) {
    Global.Setter.classSetter(Global.State)
  }
  if (Global.Setter.functionSetter[modelName]) {
    Object.keys(Global.Setter.functionSetter[modelName]).map((key) => {
      const setter = Global.Setter.functionSetter[modelName][key]
      if (setter) {
        if (!setter.selector || disableSelectorUpdate) {
          setter.setState(Global.State[modelName])
        } else {
          const newSelectorRef = setter.selector(Global.State[modelName])
          if (!shallowEqual(newSelectorRef, setter.selectorRef)) {
            setter.selectorRef = newSelectorRef
            setter.setState(Global.State[modelName])
          }
        }
      }
    })
  }
  return await next(restMiddlewares)
}

const actionMiddlewares = [
  tryCatch,
  consoleDebugger,
  devToolsListener,
  getNewState,
  setNewState,
  stateUpdater,
  communicator,
  subscription
]

const middlewares = {
  communicator,
  consoleDebugger,
  devToolsListener,
  getNewState,
  getNewStateWithCache,
  setNewState,
  stateUpdater,
  subscription,
  tryCatch,
  config
}

const applyMiddlewares = async (
  middlewares: Middleware[],
  context: BaseContext
) => {
  context.next = (restMiddlewares: Middleware[]) => {
    if (restMiddlewares.length > 0)
      return restMiddlewares[0](context as Context, restMiddlewares.slice(1))
    else return context.newState
  }
  return await middlewares[0](context as Context, middlewares.slice(1))
}

export { actionMiddlewares, applyMiddlewares, middlewares }
