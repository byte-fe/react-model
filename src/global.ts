let State: any = {}
// Communicate between Provider-Consumer and Hooks
// Use to provide backwards-compatible.
let Setter = {
  classSetter: undefined as any,
  functionSetter: {} as any
}

let devTools: any
let withDevTools: any

let uid = Math.random() // The unique id of hooks

export default { Setter, State, devTools, withDevTools, uid }
