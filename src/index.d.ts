type Setter = {
  classSetter: ClassSetter
  functionSetter: FunctionSetter
}

type FunctionSetter = {
  [modelName: string]: {
    [actionName: string]: {
      setState: React.Dispatch<any>
      depActions?: string[]
    }
  }
}

interface Global {
  Actions: {
    [modelName: string]: {
      [actionName: string]: Action
    }
  }
  State: {
    [modelName: string]: any
  }
  AsyncState: {
    [modelName: string]: undefined | ((context?: any) => Promise<Partial<any>>)
  }
  subscriptions: Subscriptions
  Setter: Setter
  devTools: any
  withDevTools: boolean
  uid: number
}

type ClassSetter = React.Dispatch<any> | undefined

// Very Sad, Promise<ProduceFunc<S>> can not work with Partial<S> | ProduceFunc<S>
type Action<S = {}, P = any, ActionKeys = {}> = (
  state: S,
  actions: getConsumerActionsType<Actions<S, ActionKeys>>,
  params: P,
  middlewareConfig?: Object
) =>
  | Partial<S>
  | Promise<Partial<S>>
  | ProduceFunc<S>
  | Promise<ProduceFunc<S>>
  | void
  | Promise<void>

// v3.0 Action
type NextAction<S = {}, P = any, ActionKeys = {}> = (
  params: P,
  context: {
    state: S
    actions: getConsumerNextActionsType<NextActions<S, ActionKeys>>
  }
) =>
  | Partial<S>
  | Promise<Partial<S>>
  | ProduceFunc<S>
  | Promise<ProduceFunc<S>>
  | void
  | Promise<void>

type ProduceFunc<S> = (state: S) => void

type Actions<S = {}, ActionKeys = {}> = {
  [P in keyof ActionKeys]: Action<S, ActionKeys[P], ActionKeys>
}

// v3.0 Actions
type NextActions<S = {}, ActionKeys = {}> = {
  [P in keyof ActionKeys]: NextAction<S, ActionKeys[P], ActionKeys>
}

type Dispatch<A> = (value: A) => void
type SetStateAction<S> = S | ((prevState: S) => S)

interface ModelContext {
  modelName: string
}

interface BaseContext<S = {}> {
  action: Action
  consumerActions: (
    actions: Actions,
    modelContext: ModelContext
  ) => getConsumerActionsType<Actions>
  params: Object
  middlewareConfig?: Object
  actionName: string
  modelName: string
  next?: Function
  newState: Global['State'] | Function | null
  Global: Global
}

interface InnerContext<S = {}> extends BaseContext<S> {
  // Actions with function type context will always invoke current component's reload.
  type?: 'function' | 'outer' | 'class'
  setState?: Dispatch<SetStateAction<S>>
}

type Context<S = {}> = (InnerContext<S>) & {
  next: Function
}

type Middleware<S = {}> = (C: Context<S>, M: Middleware<S>[]) => void

interface Models<State = any, ActionKeys = any> {
  [name: string]:
    | ModelType<State, ActionKeys>
    | API<NextModelType<State, ActionKeys>>
}

interface API<MT extends NextModelType = any> {
  __id: string
  useStore: (
    depActions?: Array<keyof MT['actions']>
  ) => [Get<MT, 'state'>, getConsumerNextActionsType<Get<MT, 'actions'>>]
  getState: () => Readonly<Get<MT, 'state'>>
  subscribe: (
    actionName: keyof MT['actions'] | Array<keyof MT['actions']>,
    callback: () => void
  ) => void
  unsubscribe: (
    actionName: keyof Get<MT, 'actions'> | Array<keyof Get<MT, 'actions'>>
  ) => void
  actions: Readonly<getConsumerNextActionsType<Get<MT, 'actions'>>>
}

interface APIs<M extends Models> {
  useStore: <K extends keyof M>(
    name: K,
    depActions?: Array<keyof Get<M[K], 'actions'>>
  ) => M[K] extends API
    ? ReturnType<Get<M[K], 'useStore'>>
    : M[K] extends ModelType
    ? [Get<M[K], 'state'>, getConsumerActionsType<Get<M[K], 'actions'>>]
    : any

  getState: <K extends keyof M>(
    modelName: K
  ) => M[K] extends ModelType
    ? Readonly<Get<M[K], 'state'>>
    : M[K] extends API
    ? ReturnType<Get<M[K], 'getState'>>
    : any
  getActions: <K extends keyof M>(
    modelName: K
  ) => M[K] extends ModelType
    ? Readonly<getConsumerActionsType<Get<M[K], 'actions'>>>
    : undefined
  getInitialState: <T extends any>(
    context?: T | undefined
  ) => Promise<{
    [modelName: string]: any
  }>
  subscribe: <K extends keyof M>(
    modelName: K,
    actionName: keyof Get<M[K], 'actions'> | Array<keyof Get<M[K], 'actions'>>,
    callback: () => void
  ) => void
  unsubscribe: <K extends keyof M>(
    modelName: K,
    actionName: keyof Get<M[K], 'actions'> | Array<keyof Get<M[K], 'actions'>>
  ) => void
  actions: {
    [K in keyof M]: Readonly<getConsumerActionsType<Get<M[K], 'actions'>>>
  }
}

type ModelType<InitStateType = any, ActionKeys = any> = {
  actions: {
    [P in keyof ActionKeys]: Action<InitStateType, ActionKeys[P], ActionKeys>
  }
  state: InitStateType
  asyncState?: (context?: any) => Promise<Partial<InitStateType>>
}

// v3.0
type NextModelType<InitStateType = any, ActionKeys = any> = {
  actions: {
    [P in keyof ActionKeys]: NextAction<
      InitStateType,
      ActionKeys[P],
      ActionKeys
    >
  }
  state: InitStateType
  asyncState?: (context?: any) => Promise<Partial<InitStateType>>
}

type ArgumentTypes<F extends Function> = F extends (...args: infer A) => any
  ? A
  : never

type getConsumerActionsType<A extends Actions<any, any>> = {
  [P in keyof A]: ArgumentTypes<A[P]>[2] extends undefined
    ? (
        params?: ArgumentTypes<A[P]>[2],
        middlewareConfig?: ArgumentTypes<A[P]>[3]
      ) => ReturnType<A[P]>
    : (
        params: ArgumentTypes<A[P]>[2],
        middlewareConfig?: ArgumentTypes<A[P]>[3]
      ) => ReturnType<A[P]>
}

// v3.0
type getConsumerNextActionsType<A extends NextActions<any, any>> = {
  [P in keyof A]: ArgumentTypes<A[P]>[0] extends undefined
    ? (params?: ArgumentTypes<A[P]>[0]) => ReturnType<A[P]>
    : (params: ArgumentTypes<A[P]>[0]) => ReturnType<A[P]>
}

type Get<Object, K extends keyof Object> = Object[K]

type ModelsProps<M extends Models> = {
  useStore: <K extends keyof M>(
    name: K,
    models?: M
  ) => M[K] extends ModelType
    ? [Get<M[K], 'state'>, getConsumerActionsType<Get<M[K], 'actions'>>]
    : M[K]
  getState: <K extends keyof M>(
    modelName: K
  ) => M[K] extends ModelType ? Readonly<Get<M[K], 'state'>> : M[K]
}

type Subscriptions = {
  [key: string]: Function[]
}
