type Setter = {
  classSetter: ClassSetter
  functionSetter: FunctionSetter
}

type FunctionSetter = {
  [modelName: string]: {
    [actionName: string]: {
      setState: React.Dispatch<any>
      selector?: Function
      selectorRef?: unknown
    }
  }
}

type Equals<X, Y> = (<T>() => T extends X ? 1 : 2) extends <T>() => T extends Y
  ? 1
  : 2
  ? true
  : false

interface Global {
  Actions: {
    [modelName: string]: {
      [actionName: string]: Action
    }
  }
  State: {
    [modelName: string]: any
  }
  mutableState: {
    [modelName: string]: any
  }
  AsyncState: {
    [modelName: string]: undefined | ((context?: any) => Promise<Partial<any>>)
  }
  Context: any
  Middlewares: {
    [modelName: string]: Middleware[]
  }
  subscriptions: Subscriptions
  Setter: Setter
  devTools: any
  withDevTools: boolean
  gid: number
  uid: number
  storeId: number
  currentStoreId: string
}

type ClassSetter = React.Dispatch<any> | undefined

type Action<S = {}, P = any, ActionKeys = {}, ExtContext extends {} = {}> = (
  params: P,
  context: {
    state: S
    actions: getConsumerActionsType<Actions<S, ActionKeys, ExtContext>>
  } & ExtContext
) =>
  | Partial<S>
  | Promise<Partial<S> | ProduceFunc<S> | void>
  | ProduceFunc<S>
  | void

type ProduceFunc<S> = (state: S) => void

// v3.0 Actions
type Actions<S = {}, ActionKeys = {}, ExtContext extends object = {}> = {
  [P in keyof ActionKeys]: Action<S, ActionKeys[P], ActionKeys, ExtContext>
}

// v4.1+ Custom Hooks
type CustomModelHook<State> = () => State

type Dispatch<A> = (value: A) => void
type SetStateAction<S> = S | ((prevState: S) => S)

interface ModelContext {
  modelName: string
}

interface BaseContext<S = {}, P = any> {
  action: Action
  consumerActions: (
    actions: Actions,
    modelContext: ModelContext
  ) => getConsumerActionsType<Actions>
  params: P
  middlewareConfig?: Object
  actionName: string
  modelName: string
  next?: Function
  disableSelectorUpdate?: boolean
  newState: Global['State'] | Function | null
  Global: Global
}

interface InnerContext<S = {}> extends BaseContext<S> {
  // Actions with function type context will always invoke current component's reload.
  // f -> function, o -> outer, c -> class, u -> useModel
  type?: 'f' | 'o' | 'c' | 'u'
  __hash?: string
}

type Context<S = {}> = InnerContext<S> & {
  next: Function
  modelMiddlewares?: Middleware[]
}

type Middleware<S = {}> = (C: Context<S>, M: Middleware<S>[]) => Promise<void>

type MiddlewareConfig = {
  logger: {
    enable: boolean | ((context: BaseContext) => boolean)
  }
  devtools: { enable: boolean }
  tryCatch: { enable: boolean }
}

interface Models<State = any, ActionKeys = any, ExtContext extends {} = {}> {
  [name: string]:
    | ModelType<State, ActionKeys, ExtContext>
    | API<ModelType<State, ActionKeys, {}>>
}

type Selector<S, R> = (state: S) => R

interface API<MT extends ModelType = ModelType<any, any, {}>> {
  __id: string
  __ERROR__?: boolean
  useStore: <
    F extends Selector<Get<MT, 'state'>, any> = Selector<
      Get<MT, 'state'>,
      unknown
    >
  >(
    selector?: F
  ) => [
    F extends Selector<Get<MT, 'state'>, any>
      ? Equals<F, Selector<Get<MT, 'state'>, unknown>> extends true
        ? Get<MT, 'state'>
        : ReturnType<F>
      : Get<MT, 'state'>,
    getConsumerActionsType<Get<MT, 'actions'>>
  ]
  getState: () => Readonly<Get<MT, 'state'>>
  subscribe: (
    actionName: keyof MT['actions'] | Array<keyof MT['actions']>,
    callback: (context: BaseContext) => void
  ) => void
  unsubscribe: (
    actionName: keyof Get<MT, 'actions'> | Array<keyof Get<MT, 'actions'>>
  ) => void
  actions: Readonly<getConsumerActionsType<Get<MT, 'actions'>>>
}

interface LaneAPI<S> {
  useStore: () => S
  getState: () => S
  subscribe: (callback: () => void) => void
  unsubscribe: (callback: () => void) => void
}

interface APIs<M extends Models> {
  useStore: <
    K extends keyof M,
    S extends M[K] extends API
      ? ArgumentTypes<Get<M[K], 'useStore'>>[1]
      : M[K] extends ModelType
      ? Selector<Get<M[K], 'state'>, unknown>
      : any
  >(
    name: K,
    selector?: S
  ) => M[K] extends API
    ? S extends (...args: any) => void
      ? Equals<S, undefined> extends true
        ? [ReturnType<Get<M[K], 'getState'>>, Get<M[K], 'actions'>]
        : ReturnType<S>
      : ReturnType<Get<M[K], 'useStore'>>
    : M[K] extends ModelType
    ? S extends (...args: any) => void
      ? [
          Equals<ReturnType<S>, unknown> extends true
            ? Get<M[K], 'state'>
            : ReturnType<S>,
          getConsumerActionsType<Get<M[K], 'actions'>>
        ]
      : [Get<M[K], 'state'>, getConsumerActionsType<Get<M[K], 'actions'>>]
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
    : M[K] extends API
    ? M[K]['actions']
    : unknown
  getInitialState: <T extends any>(
    context?: T | undefined,
    config?: { isServer: boolean }
  ) => Promise<{
    [modelName: string]: any
  }>
  subscribe: <K extends keyof M>(
    modelName: K,
    actionName: keyof Get<M[K], 'actions'> | Array<keyof Get<M[K], 'actions'>>,
    callback: (context: BaseContext) => void
  ) => void
  unsubscribe: <K extends keyof M>(
    modelName: K,
    actionName: keyof Get<M[K], 'actions'> | Array<keyof Get<M[K], 'actions'>>
  ) => void
  actions: {
    [K in keyof M]: M[K] extends API
      ? M[K]['actions']
      : Readonly<getConsumerActionsType<Get<M[K], 'actions'>>>
  }
}

// v3.0
type ModelType<
  InitStateType = any,
  ActionKeys = any,
  ExtContext extends {} = {}
> = {
  __ERROR__?: boolean
  actions: {
    [P in keyof ActionKeys]: Action<
      InitStateType,
      ActionKeys[P],
      ActionKeys,
      ExtContext
    >
  }
  middlewares?: Middleware[]
  state: InitStateType
  asyncState?: (context?: any) => Promise<Partial<InitStateType>>
}

type ArgumentTypes<F extends Function> = F extends (...args: infer A) => any
  ? A
  : never

// v3.0
// TODO: ArgumentTypes<A[P]>[0] = undefined | string
type getConsumerActionsType<A extends Actions<any, any, any>> = {
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
