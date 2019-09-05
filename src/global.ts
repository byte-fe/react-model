const State = {}
const Actions = {}
const AsyncState = {}
const Middlewares = {}
// Communicate between Provider-Consumer and Hooks
const Setter: Setter = {
  // classSetter stores the setState from Provider
  // Invoke the classSetter.setState can update the state of Global Provider.
  classSetter: undefined,
  // functionSetter stores the setState returned by useStore.
  // These setStates can invoke the rerender of hooks components.
  functionSetter: {}
}

const Context = {
  __global: {}
}

const subscriptions = {}

let devTools: any
let withDevTools = false

let uid = 0 // The unique id of hooks

export default {
  Actions,
  AsyncState,
  Context,
  Middlewares,
  Setter,
  State,
  devTools,
  subscriptions,
  uid,
  withDevTools
} as Global
