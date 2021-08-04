# react-model &middot; ![GitHub license](https://img.shields.io/badge/license-MIT-blue.svg) [![npm version](https://img.shields.io/npm/v/react-model.svg?style=flat)](https://www.npmjs.com/package/react-model) [![minified size](https://badgen.net/bundlephobia/min/react)](https://bundlephobia.com/result?p=react-model) [![Build Status](https://travis-ci.org/byte-fe/react-model.svg?branch=master)](https://travis-ci.org/byte-fe/react-model) [![size](http://img.badgesize.io/https://cdn.jsdelivr.net/npm/react-model/dist/react-model.js?compression=gzip)](http://img.badgesize.io/https://cdn.jsdelivr.net/npm/react-model/dist/react-model.js) [![downloads](https://img.shields.io/npm/dt/react-model.svg)](https://www.npmjs.com/package/react-model) [![Coverage Status](https://codecov.io/gh/byte-fe/react-model/branch/master/graph/badge.svg)](https://codecov.io/gh/byte-fe/react-model) [![Greenkeeper badge](https://badges.greenkeeper.io/byte-fe/react-model.svg)](https://greenkeeper.io/) ![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)

The State management library for React

🎉 Support Both Class and Hooks Api

⚛️ Support [preact](https://github.com/byte-fe/react-model-experiment/tree/preact), react-native and Next.js

⚔ Full TypeScript Support

📦 Built with microbundle

⚙️ Middleware Pipline ( redux-devtools support ... )

☂️ 100% test coverage, safe on production

🐛 Debug easily on test environment

```tsx
import { useModel, createStore } from 'react-model'

// define model
const useTodo = () => {
  const [items, setItems] = useModel(['Install react-model', 'Read github docs', 'Build App'])
  return { items, setItems }
}

// Model Register
const { useStore } = createStore(Todo)

const App = () => {
  return <TodoList />
}

const TodoList = () => {
  const { items, setItems } = useStore()
  return <div>
    <Addon handler={setItems} />
    {state.items.map((item, index) => (<Todo key={index} item={item} />))}
  </div>
}
```

---

## Recently Updated

* [feat(middleware): support enable/disable sepecific middleware](#how-can-i-disable-the-console-debugger)
* fix(stateupdater): fix the issue that setState on unmounted component

## Quick Start

[createStore + useModel](https://codesandbox.io/s/createstore-usemodal-all-of-your-state-4u8s6)

[CodeSandbox: TodoMVC](https://codesandbox.io/s/moyxon99jx)

[Next.js + react-model work around](https://github.com/byte-fe/react-model-experiment)

[v2 docs](https://github.com/byte-fe/react-model/blob/v2/README.md)

install package

```shell
npm install react-model
```

## Table of Contents

- [Core Concept](#core-concept)
  - [createStore](#createstore)
  - [Model](#model)
  - [Model Register](#model-register)
  - [useStore](#usestore)
  - [getState](#getstate)
  - [actions](#actions)
  - [subscribe](#subscribe)
- [Advance Concept](#advance-concept)
  - [immutable Actions](#immutable-actions)
  - [SSR with Next.js](#ssr-with-nextjs)
  - [Middleware](#middleware)
  - [Expand Context](#expand-context)
- [Other Concept required by Class Component](#other-concept-required-by-class-component)
  - [Provider](#provider)
  - [connect](#connect)
- [FAQ](#faq)
  - [Migrate from 4.0.x to 4.1.x](#migrate-from-40x-to-41x)
  - [Migrate from 3.1.x to 4.x.x](#migrate-from-31x-to-4xx)
  - [How can I disable the console debugger?](#how-can-i-disable-the-console-debugger)
  - [How can I add custom middleware](#how-can-i-add-custom-middleware)
    - [How can I make persist models](#how-can-i-make-persist-models)
  - [How can I deal with local state](#how-can-i-deal-with-local-state)
  - [How can I deal with huge dataset / circular dataset](#how-can-i-deal-with-huge-dataset--circular-dataset)
  - [actions throw error from immer.module.js](#actions-throw-error-from-immermodulejs)
  - [How can I customize each model's middlewares?](#how-can-i-customize-each-models-middlewares)

## Core Concept

### createStore

You can create a shared / local store by createStore api.

[Online Demo](https://codesandbox.io/s/createstore-usemodal-all-of-your-state-4u8s6)

`model/counter.ts`

```typescript
import { useState } from 'react'
import { useModel } from 'react-model'
const { useStore } = createStore(() => {
  const [localCount, setLocalCount] = useState(1) // Local State, Independent in different components
  const [count, setCount] = useModel(1) // Global State, the value is the same in different components
  const incLocal = () => {
    setLocalCount(localCount + 1)
  }
  const inc = () => {
    setCount(c => c + 1)
  }
  return { count, localCount, incLocal, inc }
})

export default useStore
```

`page/counter-1.tsx`

```tsx
import useSharedCounter from 'models/global-counter'
const Page = () => {
  const { count, localCount, inc, incLocal } = useStore()
  return <div>
    <span>count: { count }</span>
    <span>localCount: { localCount }</span>
    <button onClick={inc}>inc</button>
    <button onClick={incLocal}>incLocal</button>
  </div>
}
```

### Model

Every model has its own state and actions.

```typescript
const initialState = {
  counter: 0,
  light: false,
  response: {}
}

interface StateType {
  counter: number
  light: boolean
  response: {
    code?: number
    message?: string
  }
}

interface ActionsParamType {
  increment: number
  openLight: undefined
  get: undefined
} // You only need to tag the type of params here !

const model: ModelType<StateType, ActionsParamType> = {
  actions: {
    increment: async (payload, { state }) => {
      return {
        counter: state.counter + (payload || 1)
      }
    },
    openLight: async (_, { state, actions }) => {
      await actions.increment(1) // You can use other actions within the model
      await actions.get() // support async functions (block actions)
      actions.get()
      await actions.increment(1) // + 1
      await actions.increment(1) // + 2
      await actions.increment(1) // + 3 as expected !
      return { light: !state.light }
    },
    get: async () => {
      await new Promise((resolve, reject) =>
        setTimeout(() => {
          resolve()
        }, 3000)
      )
      return {
        response: {
          code: 200,
          message: `${new Date().toLocaleString()} open light success`
        }
      }
    }
  },
  state: initialState
}

export default model

// You can use these types when use Class Components.
// type ConsumerActionsType = getConsumerActionsType<typeof Model.actions>
// type ConsumerType = { actions: ConsumerActionsType; state: StateType }
// type ActionType = ConsumerActionsType
// export { ConsumerType, StateType, ActionType }
```

[⇧ back to top](#table-of-contents)

### Model Register

react-model keeps the application state and actions in separate private stores. So you need to register them if you want to use them as the public models.

`model/index.ts`

```typescript
import { Model } from 'react-model'
import Home from '../model/home'
import Shared from '../model/shared'

const models = { Home, Shared }

export const { getInitialState, useStore, getState, actions, subscribe, unsubscribe } = Model(models)
```

[⇧ back to top](#table-of-contents)

### useStore

The functional component in React ^16.8.0 can use Hooks to connect the global store.
The actions returned from useStore can invoke dom changes.

The execution of actions returned by useStore will invoke the rerender of current component first.

It's the only difference between the actions returned by useStore and actions now.

```tsx
import React from 'react'
import { useStore } from '../index'

// CSR
export default () => {
  const [state, actions] = useStore('Home')
  const [sharedState, sharedActions] = useStore('Shared')

  return (
    <div>
      Home model value: {JSON.stringify(state)}
      Shared model value: {JSON.stringify(sharedState)}
      <button onClick={e => actions.increment(33)}>home increment</button>
      <button onClick={e => sharedActions.increment(20)}>
        shared increment
      </button>
      <button onClick={e => actions.get()}>fake request</button>
      <button onClick={e => actions.openLight()}>fake nested call</button>
    </div>
  )
}
```

optional solution on huge dataset (example: TodoList(10000+ Todos)):

1. use useStore on the subComponents which need it.
2. use useStore selector. (version >= v4.0.0-rc.0)

[advance example with 1000 todo items](https://codesandbox.io/s/react-model-v4-todomvc-oxyij)

[⇧ back to top](#table-of-contents)

### getState

Key Point: [State variable not updating in useEffect callback](https://github.com/facebook/react/issues/14066)

To solve it, we provide a way to get the current state of model: getState

Note: the getState method cannot invoke the dom changes automatically by itself.

> Hint: The state returned should only be used as readonly

```jsx
import { useStore, getState } from '../model/index'

const BasicHook = () => {
  const [state, actions] = useStore('Counter')
  useEffect(() => {
    console.log('some mounted actions from BasicHooks')
    return () =>
      console.log(
        `Basic Hooks unmounted, current Counter state: ${JSON.stringify(
          getState('Counter')
        )}`
      )
  }, [])
  return (
    <>
      <div>state: {JSON.stringify(state)}</div>
    </>
  )
}
```

[⇧ back to top](#table-of-contents)

### actions

You can call other models' actions with actions api

actions can be used in both class components and functional components.

```js
import { actions } from './index'

const model = {
  state: {},
  actions: {
    crossModelCall: () => {
      actions.Shared.changeTheme('dark')
      actions.Counter.increment(9)
    }
  }
}

export default model
```

[⇧ back to top](#table-of-contents)

### subscribe

subscribe(storeName, actions, callback) run the callback when the specific actions executed.

```typescript
import { subscribe, unsubscribe } from './index'

const callback = () => {
  const user = getState('User')
  localStorage.setItem('user_id', user.id)
}

// subscribe action
subscribe('User', 'login', callback)
// subscribe actions
subscribe('User', ['login', 'logout'], callback)
// unsubscribe the observer of some actions
unsubscribe('User', 'login') // only logout will run callback now
```

[⇧ back to top](#table-of-contents)

## Advance Concept

### immutable Actions

The actions use [immer](https://github.com/mweststrate/immer) produce API to modify the Store. You can return a producer in action.

Using function as return value can make your code cleaner when you modify the deep nested value.

TypeScript Example

```ts
// StateType and ActionsParamType definition
// ...

const model: ModelType<StateType, ActionsParamType> = {
  actions: {
    increment: async (params, { state: s }) => {
      // return (state: typeof s) => { // TypeScript < 3.9
      return state => {
        state.counter += params || 1
      }
    },
    decrease: params => s => {
      s.counter += params || 1
    }
  }
}

export default model
```

JavaScript Example

```js
const Model = {
  actions: {
    increment: async (params) => {
      return state => {
        state.counter += params || 1
      }
    }
  }
}
```

[⇧ back to top](#table-of-contents)

### SSR with Next.js

<details>
<summary>Store: shared.ts</summary>
<p>

```ts
const initialState = {
  counter: 0
}

const model: ModelType<StateType, ActionsParamType> = {
  actions: {
    increment: (params, { state }) => {
      return {
        counter: state.counter + (params || 1)
      }
    }
  },
  // Provide for SSR
  asyncState: async context => {
    await waitFor(4000)
    return { counter: 500 }
  },
  state: initialState
}

export default model
```

</p>
</details>

<details>
<summary>Global Config: _app.tsx</summary>
<p>


```tsx
import { models, getInitialState, Models } from '../model/index'

let persistModel: any

interface ModelsProps {
  initialModels: Models
  persistModel: Models
}

const MyApp = (props: ModelsProps) => {
  if ((process as any).browser) {
    // First come in: initialModels
    // After that: persistModel
    persistModel = props.persistModel || Model(models, props.initialModels)
  }
  const { Component, pageProps, router } = props
  return (
    <Container>
      <Component {...pageProps} />
    </Container>
  )
}

MyApp.getInitialProps = async (context: NextAppContext) => {
  if (!(process as any).browser) {
    const initialModels = context.Component.getInitialProps
      ? await context.Component.getInitialProps(context.ctx)
      await getInitialState(undefined, { isServer: true }) // get all model initialState
      // : await getInitialState({ modelName: 'Home' }, { isServer: true }) // get Home initialState only
      // : await getInitialState({ modelName: ['Home', 'Todo'] }, { isServer: true }) // get multi initialState
      // : await getInitialState({ data }, { isServer: true }) // You can also pass some public data as asyncData params.
    return { initialModels }
  } else {
    return { persistModel }
  }
}
```
</p>
</details>

<details>
<summary>Page: hooks/index.tsx</summary>
<p>

```tsx
import { useStore, getState } from '../index'
export default () => {
  const [state, actions] = useStore('Home')
  const [sharedState, sharedActions] = useStore('Shared')

  return (
    <div>
      Home model value: {JSON.stringify(state)}
      Shared model value: {JSON.stringify(sharedState)}
      <button
        onClick={e => {
          actions.increment(33)
        }}
      >
    </div>
  )
}
```
</p>
</details>

<details>
<summary>Single Page Config: benchmark.tsx</summary>
<p>

```tsx
// ...
Benchmark.getInitialProps = async () => {
  return await getInitialState({ modelName: 'Todo' }, { isServer: true })
}
```
</p>
</details>

[⇧ back to top](#table-of-contents)

### Middleware

We always want to try catch all the actions, add common request params, connect Redux devtools and so on. We Provide the middleware pattern for developer to register their own Middleware to satisfy the specific requirement.

```tsx
// Under the hood
const tryCatch: Middleware<{}> = async (context, restMiddlewares) => {
  const { next } = context
  await next(restMiddlewares).catch((e: any) => console.log(e))
}

// ...

let actionMiddlewares = [
  tryCatch,
  getNewState,
  setNewState,
  stateUpdater,
  communicator,
  devToolsListener
]

// ...
// How we execute an action
const consumerAction = (action: Action) => async (params: any) => {
  const context: Context = {
    modelName,
    setState,
    actionName: action.name,
    next: () => {},
    newState: null,
    params,
    consumerActions,
    action
  }
  await applyMiddlewares(actionMiddlewares, context)
}

// ...

export { ... , actionMiddlewares}
```

⚙️ You can override the actionMiddlewares and insert your middleware to specific position

[⇧ back to top](#table-of-contents)

### Expand Context

```typescript
const ExtCounter: ModelType<
  { name: string }, // State Type
  { ext: undefined }, // ActionParamsType
  { name: string } // ExtContextType
> = {
  actions: {
    // { state, action } => { state, action, [name] }
    ext: (_, { name }) => {
      return { name }
    }
  },
  state: { name: '' }
}

const { useStore } = Model(ExtCounter, { name: 'test' })
// state.name = ''
const [state, actions] = useStore()
// ...
actions.ext()
// state.name => 'test'
```

[⇧ back to top](#table-of-contents)

## Other Concept required by Class Component

### Provider

The global state standalone can not effect the react class components, we need to provide the state to react root component.

```jsx
import { PureComponent } from 'react'
import { Provider } from 'react-model'

class App extends PureComponent {
  render() {
    return (
      <Provider>
        <Counter />
      </Provider>
    )
  }
}
```

[⇧ back to top](#table-of-contents)

### connect

We can use the Provider state with connect.

<details>
<summary>Javascript decorator version</summary>
<p>

```jsx
import React, { PureComponent } from 'react'
import { Provider, connect } from 'react-model'

const mapProps = ({ light, counter }) => ({
  lightStatus: light ? 'open' : 'close',
  counter
}) // You can map the props in connect.

@connect(
  'Home',
  mapProps
)
export default class JSCounter extends PureComponent {
  render() {
    const { state, actions } = this.props
    return (
      <>
        <div>states - {JSON.stringify(state)}</div>
        <button onClick={e => actions.increment(5)}>increment</button>
        <button onClick={e => actions.openLight()}>Light Switch</button>
      </>
    )
  }
}
```

</p>
</details>

<details>
<summary>TypeScript Version</summary>
<p>

```tsx
import React, { PureComponent } from 'react'
import { Provider, connect } from 'react-model'
import { StateType, ActionType } from '../model/home'

const mapProps = ({ light, counter, response }: StateType) => ({
  lightStatus: light ? 'open' : 'close',
  counter,
  response
})

type RType = ReturnType<typeof mapProps>

class TSCounter extends PureComponent<
  { state: RType } & { actions: ActionType }
> {
  render() {
    const { state, actions } = this.props
    return (
      <>
        <div>TS Counter</div>
        <div>states - {JSON.stringify(state)}</div>
        <button onClick={e => actions.increment(3)}>increment</button>
        <button onClick={e => actions.openLight()}>Light Switch</button>
        <button onClick={e => actions.get()}>Get Response</button>
        <div>message: {JSON.stringify(state.response)}</div>
      </>
    )
  }
}

export default connect(
  'Home',
  mapProps
)(TSCounter)
```
</p>
</details>

[⇧ back to top](#table-of-contents)

## FAQ

### Migrate from 4.0.x to 4.1.x

1. replace Model with createStore

`counter.ts`

```ts
import { createStore } from 'react-model'
// Remove typedef below
// type CounterState = {
//  count: number
// }

// type CounterActionParams = {
//   increment: number
// }

// v4.0.x model
const Counter: ModelType<
  CounterState,
  CounterActionParams
> = {
  actions: {
    increment: (params) => {
      return (state) => {
        state.count += params
      }
    }
  },
  state: { count: 0 }
}

// v4.1.x
const Counter = createStore(() => {
  const [state, setState] = useModel({ count: 0 })
  const actions = {
    increment: (params) => {
      setState((state) => {
        state.count += params
      })
    }
  }
  return [state, actions] as const
})

export default Counter
```

2. Remove Counter from model registry

```ts
const models = {
  // Counter
  Shared
}

export const { getInitialState, useStore, getState, actions, subscribe, unsubscribe } = Model(models)
```

3. update useStore calls in components

```tsx
// import { useStore } from 'models'
import Counter from 'models/counter'

const Component = () => {
  // const [state, actions] = useStore('Counter')
  const [state, actions] = Counter.useStore()
}
```

### Migrate from 3.1.x to 4.x.x

1. remove Model wrapper

`sub-model.ts`
```ts
// 3.1.x
export default Model(model)
// 4.x.x
export default model
```

`models.ts`
```ts
import Sub from './sub-model'
export default Model({ Sub })
```

2. use selector to replace depActions

`Shared.ts`
```ts
interface State {
  counter: number
  enable: boolean
}

interface ActionParams {
  add: number
  switch: undefined
}

const model: ModelType<State, ActionParams> = {
  state: {
    counter: 1
    enable: false
  },
  actions: {
    add: (payload) => state => {
      state.counter += payload
    },
    switch: () => state => {
      state.enable = !state.enable
    }
  }
}
```

```ts
const Component = () => {
  // 3.1.x, Component rerender when add action is invoked
  const [counter] = useStore('Shared', ['add'])
  // 4.x.x, Component rerender when counter value diff
  const [counter] = useStore('Shared', state => state.counter)
}
```

### How can I disable the console debugger


```typescript
import { middlewares } from 'react-model'
// Find the index of middleware

// Disable all actions' log
middlewares.config.logger.enable = false
// Disable logs from specific type of actions
middlewares.config.logger.enable = ({ actionName }) => ['increment'].indexOf(actionName) !== -1
```

[⇧ back to top](#table-of-contents)

### How can I add custom middleware

```typescript
import { actionMiddlewares, middlewares, Model } from 'react-model'
import { sendLog } from 'utils/log'
import Home from '../model/home'
import Shared from '../model/shared'

// custom middleware
const ErrorHandler: Middleware = async (context, restMiddlewares) => {
  const { next } = context
  await next(restMiddlewares).catch((e: Error) => sendLog(e))
}

// Find the index of middleware
const getNewStateMiddlewareIndex = actionMiddlewares.indexOf(
  middlewares.getNewState
)

// Replace it
actionMiddlewares.splice(getNewStateMiddlewareIndex, 0, ErrorHandler)

const stores = { Home, Shared }

export default Model(stores)
```

[⇧ back to top](#table-of-contents)

#### How can I make persist models

```typescript
import { actionMiddlewares, Model } from 'react-model'
import Example from 'models/example'

// Example, not recommend to use on production directly without consideration
// Write current State to localStorage after action finish
const persistMiddleware: Middleware = async (context, restMiddlewares) => {
  localStorage.setItem('__REACT_MODEL__', JSON.stringify(context.Global.State))
  await context.next(restMiddlewares)
}

// Use on all models
actionMiddlewares.push(persistMiddleware)
Model({ Example }, JSON.parse(localStorage.getItem('__REACT_MODEL__')))

// Use on single model
const model = {
  state: JSON.parse(localStorage.getItem('__REACT_MODEL__'))['you model name']
  actions: { ... },
  middlewares: [...actionMiddlewares, persistMiddleware]
}


```

[⇧ back to top](#table-of-contents)

### How can I deal with local state

What should I do to make every Counter hold there own model? 🤔

```tsx
class App extends Component {
  render() {
    return (
      <div className="App">
        <Counter />
        <Counter />
        <Counter />
      </div>
    )
  }
}
```

<details>
<summary>Counter model</summary>
<p>

```ts
interface State {
  count: number
}

interface ActionParams {
  increment: number
}

const model: ModelType<State, ActionParams> = {
  state: {
    count: 0
  },
  actions: {
    increment: payload => {
      // immer.module.js:972 Uncaught (in promise) Error: An immer producer returned a new value *and* modified its draft. Either return a new value *or* modify the draft
      // Not allowed
      // return state => (state.count += payload)
      return state => {
        state.count += payload
      }
    }
  }
}

```

</p>
</details>

<details>
<summary>Counter.tsx</summary>
<p>

```tsx

const Counter = () => {
  const [{ useStore }] = useState(() => Model(model))
  const [state, actions] = useStore()
  return (
    <div>
      <div>{state.count}</div>
      <button onClick={() => actions.increment(3)}>Increment</button>
    </div>
  )
}

export default Counter
```

</p>
</details>

[⇧ back to top](#table-of-contents)

### How can I deal with huge dataset / circular dataset

[Immer assumes your state to be a unidirectional tree. That is, no object should appear twice in the tree, there should be no circular references.](https://immerjs.github.io/immer/pitfalls#immer-only-supports-unidirectional-trees)

Immer freezes everything recursively, for large data objects that won't be changed in the future this might be over-kill, in that case it can be more efficient to shallowly pre-freeze data using the freeze utility.

```ts
import { freeze } from 'immer'

export const ExpensiveModel: ModelType<ExpensiveState, ExpensiveActionParams> = {
  state: {
    moduleList: []
  },
  actions: {
    setPreFreezedDataset: () => {
      const optimizedDataset = freeze(hugeDataset)
      return { moduleList: optimizedDataset }
    }
  }
}
```

### actions throw error from immer.module.js

```
immer.module.js:972 Uncaught (in promise) Error: An immer producer returned a new value *and* modified its draft. Either return a new value *or* modify the draft
```

How to fix:

```tsx
actions: {
  increment: payload => {
    // Not allowed
    // return state => (state.count += payload)
    return state => {
      state.count += payload
    }
  }
}
```

[⇧ back to top](#table-of-contents)

### How can I customize each model's middlewares?

You can customize each model's middlewares.

```typescript
import { actionMiddlewares, Model } from 'react-model'
const delayMiddleware: Middleware = async (context, restMiddlewares) => {
  await timeout(1000, {})
  context.next(restMiddlewares)
}

const nextCounterModel: ModelType<CounterState, NextCounterActionParams> = {
  actions: {
    add: num => {
      return state => {
        state.count += num
      }
    },
    increment: async (num, { actions }) => {
      actions.add(num)
      await timeout(300, {})
    }
  },
  // You can define the custom middlewares here
  middlewares: [delayMiddleware, ...actionMiddlewares],
  state: {
    count: 0
  }
}

export default Model(nextCounterModel)
```

[⇧ back to top](#table-of-contents)
