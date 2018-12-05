type State<T> = T

type Action<T, P = any, ActionKeys = []> = (
  state: T,
  actions: getConsumerActionsType<Actions<T, ActionKeys>>,
  params: P
) => Partial<T>

type ProviderProps = { [name: string]: ModelType<any, any> }

type Actions<T, ActionKeys> = {
  [P in keyof ActionKeys]: Action<T, ActionKeys[P], ActionKeys>
}

type ModelType<InitStateType, ActionKeys> = {
  actions: {
    [P in keyof ActionKeys]: Action<InitStateType, ActionKeys[P], ActionKeys>
  }
  state: { [P in keyof InitStateType]: InitStateType[P] }
}

type ArgumentTypes<F extends Function> = F extends (...args: infer A) => any
  ? A
  : never

type getConsumerActionsType<T> = {
  [P in keyof T]: ArgumentTypes<T[P]>[2] extends undefined
    ? (params?: ArgumentTypes<T[P]>[2]) => ReturnType<T[P]>
    : (params: ArgumentTypes<T[P]>[2]) => ReturnType<T[P]>
}
