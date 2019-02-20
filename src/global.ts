let State: any = {}
// Communicate between Provider-Consumer and Hooks
// Use to provide backwards-compatible.
let Setter: Setter = {
  // classSetter stores the setState from Provider, invoke the classSetter.setState can update the state of Global Provider.
  classSetter: undefined,
  // functionSetter stores the setState returned by useStore. These setStates can invoke the rerender of hooks components.
  functionSetter: {}
}

let devTools: any
let withDevTools: boolean = false

let uid = Math.random() // The unique id of hooks

export default { Setter, State, devTools, withDevTools, uid }
