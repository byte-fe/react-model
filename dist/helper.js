import { createContext } from 'react';
var initialProviderState = {};
var GlobalContext = createContext(initialProviderState);
var Consumer = GlobalContext.Consumer;
export { Consumer, GlobalContext };
