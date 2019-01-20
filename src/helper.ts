import produce from 'immer'
import { createContext } from 'react'
import Global from './global'

const initialProviderState: ProviderProps = {}
const GlobalContext = createContext(initialProviderState)
const Consumer = GlobalContext.Consumer

const setPartialState = (
  name: keyof typeof Global.State,
  partialState: typeof Global.State | Function = {}
) => {
  if (typeof partialState === 'function') {
    let state = Global.State[name].state
    state = produce(state, partialState)
    Global.State = produce(Global.State, s => {
      s[name].state = state
    })
  } else {
    Global.State = produce(Global.State, s => {
      s[name].state = {
        ...s[name].state,
        ...partialState
      }
    })
  }
  return Global.State
}

const timeout = (ms: number, data: any) =>
  new Promise(resolve =>
    setTimeout(() => {
      console.log(ms)
      resolve(data)
    }, ms)
  )

const getInitialState = async <T extends { modelName?: string | string[] }>(
  context?: T
) => {
  await Promise.all(
    Object.keys(Global.State).map(async modelName => {
      if (
        !context ||
        !context.modelName ||
        modelName === context.modelName ||
        context.modelName.indexOf(modelName) !== -1
      ) {
        const model = Global.State[modelName]
        const asyncState = model.asyncState
          ? await model.asyncState(context)
          : {}
        Global.State[modelName].state = {
          ...Global.State[modelName].state,
          ...asyncState
        }
      }
    })
  )
  return Global.State
}

const getCache = (modelName: string, actionName: string) => {
  const JSONString = localStorage.getItem(
    `__REACT_MODELX__${modelName}_${actionName}`
  )
  return JSONString ? JSON.parse(JSONString) : null
}

export {
  Consumer,
  GlobalContext,
  setPartialState,
  timeout,
  getCache,
  getInitialState
}
