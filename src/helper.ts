import { createContext } from 'react'

const initialProviderState: ProviderProps = {}
const GlobalContext = createContext(initialProviderState)
const Consumer = GlobalContext.Consumer

export { Consumer, GlobalContext }
