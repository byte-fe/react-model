import { getCache, setPartialState, timeout } from './helper'
// -- Middlewares --

const tryCatch: Middleware = async (context, restMiddlewares) => {
  const { next } = context
  await next(restMiddlewares).catch((e: any) => console.log(e))
}

const getNewState: Middleware = async (context, restMiddlewares) => {
  const { action, modelName, consumerActions, params, next, Global } = context
  context.newState =
    (await action(params, {
      actions: consumerActions(Global.Actions[modelName], { modelName }),
      state: Global.State[modelName],
      ...(Global.Context['__global'] || {}),
      ...(Global.Context[modelName] || {})
    })) || null
  await next(restMiddlewares)
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
  await next(restMiddlewares)
}

const setNewState: Middleware = async (context, restMiddlewares) => {
  const { modelName, newState, next } = context
  if (newState) {
    setPartialState(modelName, newState)
    await next(restMiddlewares)
  }
}

const stateUpdater: Middleware = async (context, restMiddlewares) => {
  const { modelName, next, Global } = context
  if (context.type === 'function' && context.setState) {
    context.setState(Global.State[modelName])
  }
  await next(restMiddlewares)
}

const subscription: Middleware = async (context, restMiddlewares) => {
  const { modelName, actionName, next, Global } = context
  const subscriptions = Global.subscriptions[`${modelName}_${actionName}`]
  if (subscriptions) {
    subscriptions.forEach(callback => {
      callback()
    })
  }
  await next(restMiddlewares)
}

const consoleDebugger: Middleware = async (context, restMiddlewares) => {
  const { Global } = context
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
  await context.next(restMiddlewares)
  console.log(
    '%c Next',
    `color: #4CAF50; font-weight: bold`,
    Global.State[context.modelName]
  )
  console.groupEnd()
}

const devToolsListener: Middleware = async (context, restMiddlewares) => {
  const { Global } = context
  await context.next(restMiddlewares)
  if (Global.withDevTools) {
    Global.devTools.send(
      `${context.modelName}_${context.actionName}`,
      Global.State
    )
  }
}

const communicator: Middleware = async (context, restMiddlewares) => {
  const { modelName, next, actionName, Global } = context
  if (Global.Setter.classSetter) {
    Global.Setter.classSetter(Global.State)
  }
  if (Global.Setter.functionSetter[modelName]) {
    Object.keys(Global.Setter.functionSetter[modelName]).map(key => {
      const setter = Global.Setter.functionSetter[modelName][key]
      if (setter) {
        if (
          !setter.depActions ||
          setter.depActions.indexOf(actionName) !== -1
        ) {
          setter.setState(Global.State[modelName])
        }
      }
    })
  }
  await next(restMiddlewares)
}

let actionMiddlewares = [
  getNewState,
  setNewState,
  stateUpdater,
  communicator,
  subscription
]

if (process.env.NODE_ENV === 'production') {
  actionMiddlewares = [tryCatch, ...actionMiddlewares]
} else {
  actionMiddlewares = [consoleDebugger, devToolsListener, ...actionMiddlewares]
}

const middlewares = {
  communicator,
  consoleDebugger,
  devToolsListener,
  getNewState,
  getNewStateWithCache,
  setNewState,
  stateUpdater,
  subscription,
  tryCatch
}

const applyMiddlewares = async (
  middlewares: Middleware[],
  context: BaseContext
) => {
  context.next = (restMiddlewares: Middleware[]) =>
    restMiddlewares.length > 0 &&
    restMiddlewares[0](context as Context, restMiddlewares.slice(1))
  if (middlewares.length > 0) {
    await middlewares[0](context as Context, middlewares.slice(1))
  }
}

export { actionMiddlewares, applyMiddlewares, middlewares }
