import Global from './global'
import { setPartialState } from './helper'
// -- Middlewares --

const tryCatch: Middleware<{}> = (context, restMiddlewares) => {
  const { next } = context
  next(restMiddlewares).catch((e: any) => console.log(e))
}

const getNewState: Middleware<{}> = async (context, restMiddlewares) => {
  const { action, modelName, consumerActions, params, next } = context
  context.newState = await action(
    Global.State[modelName].state,
    consumerActions(Global.State[modelName].actions),
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

const stateUpdater: Middleware = (context, restMiddlewares) => {
  const { setState, modelName, next } = context
  setState(Global.State[modelName].state)
  next(restMiddlewares)
}

const devToolsListener: Middleware = (context, restMiddlewares) => {
  if (Global.withDevTools) {
    Global.devTools.send(
      `${context.modelName}_${context.actionName}`,
      Global.State
    )
  }
  context.next(restMiddlewares)
}

const communicator: Middleware<{}> = (context, restMiddlewares) => {
  const { modelName, next } = context
  Global.Setter.classSetter && Global.Setter.classSetter(Global.State)
  Object.keys(Global.Setter.functionSetter[modelName]).map(
    key =>
      Global.Setter.functionSetter[modelName][key] &&
      Global.Setter.functionSetter[modelName][key].setState(
        Global.State[modelName].state
      )
  )
  next(restMiddlewares)
}

let actionMiddlewares = [
  tryCatch,
  getNewState,
  setNewState,
  stateUpdater,
  communicator,
  devToolsListener
]

const applyMiddlewares = (middlewares: Middleware[], context: Context) => {
  context.next = (restMiddlewares: Middleware[]) =>
    restMiddlewares.length > 0 &&
    restMiddlewares[0](context, restMiddlewares.slice(1))
  middlewares.length > 0 && middlewares[0](context, middlewares.slice(1))
}

export { actionMiddlewares, applyMiddlewares }
