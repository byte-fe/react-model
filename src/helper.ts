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

const getCache = (modelName: string, actionName: string) => {
  const JSONString = localStorage.getItem(
    `__REACT_MODELX__${modelName}_${actionName}`
  )
  return JSONString ? JSON.parse(JSONString) : null
}

export { Consumer, GlobalContext, setPartialState, timeout, getCache }
