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

export { Consumer, GlobalContext, setPartialState }
