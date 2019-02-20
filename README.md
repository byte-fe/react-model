# react-model &middot; ![GitHub license](https://img.shields.io/badge/license-MIT-blue.svg) [![npm version](https://img.shields.io/npm/v/react-model.svg?style=flat)](https://www.npmjs.com/package/react-model) [![Build Status](https://travis-ci.org/byte-fe/react-model.svg?branch=master)](https://travis-ci.org/byte-fe/react-model) [![size](http://img.badgesize.io/https://cdn.jsdelivr.net/npm/react-model/dist/react-model.js?compression=gzip)](http://img.badgesize.io/https://cdn.jsdelivr.net/npm/react-model/dist/react-model.js) [![downloads](https://img.shields.io/npm/dt/react-model.svg)](https://www.npmjs.com/package/react-model) [![Coverage Status](https://codecov.io/gh/byte-fe/react-model/branch/master/graph/badge.svg)](https://codecov.io/gh/byte-fe/react-model) [![Greenkeeper badge](https://badges.greenkeeper.io/byte-fe/react-model.svg)](https://greenkeeper.io/) ![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)

The State management library for React

🎉 Support Hooks Api

👬 Fully TypeScript Support

📦 gzip bundle < 2KB with microbundle

⚙️ Middlewares Pipline ( redux-devtools support ... )

---

## Quick Start

[CodeSandbox: TodoMVC](https://codesandbox.io/s/moyxon99jx)

[Next.js + react-model work around](https://github.com/byte-fe/react-model-experiment)

install package

```
npm install react-model
```

## Table of Contents

- [Core Concept](#core-concept)
  - [Model Register](#model-register)
  - [useStore](#usestore)
  - [Model](#model)
  - [getState](#getstate)
- [Advance Concept](#advance-concept)
  - [immutable Actions](#immutable-actions)
  - [SSR with Next.js](#ssr-with-nextjs)
  - [Middleware](#middleware)
- [Other Concept required by Class Component ( Not First Class, ONLY SUPPORT ON CSR, Welcome to PR )](#other-concept-required-by-class-component--not-first-class-only-support-on-csr-welcome-to-pr-)
  - [Provider](#provider)
  - [connect](#connect)

## Core Concept

### Model Register

react-model keep the state and actions in a global store. So you need to register them before using.

`model/index.model.ts`

```typescript
import { Model } from 'react-model'
import Home from '../model/home.model'
import Shared from '../model/shared.model'

const models = { Home, Shared }

export const { getInitialState, useStore, getState } = Model(models)
export type Models = typeof models
```

[⇧ back to top](#table-of-contents)

### useStore

The functional component in React ^16.8.0 can use Hooks to connect the global store.
The actions return from useStore can invoke the dom changes.

```tsx
import React from 'react'
import { useStore } from '../index.model'

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
2. [use useStore with depActions and React.memo to prevent child components rerender frequently.](https://github.com/ArrayZoneYour/react-model-todomvc/blob/master/src/components/TodoItem.tsx)

[Demo Repo](https://github.com/ArrayZoneYour/react-model-todomvc)

[⇧ back to top](#table-of-contents)

### Model

Every model have their own state and actions.

```typescript
const initialState = {
  counter: 0,
  light: false,
  response: {} as {
    code: number
    message: string
  }
}

type StateType = typeof initialState
type ActionsParamType = {
  increment: number
  openLight: undefined
  get: undefined
} // You only need to tag the type of params here !

const Model: ModelType<StateType, ActionsParamType> = {
  actions: {
    increment: async (state, _, params) => {
      return {
        counter: state.counter + (params || 1)
      }
    },
    openLight: async (state, actions) => {
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

export default Model

// You can use these types when use Class Components.
// type ConsumerActionsType = getConsumerActionsType<typeof Model.actions>
// type ConsumerType = { actions: ConsumerActionsType; state: StateType }
// type ActionType = ConsumerActionsType
// export { ConsumerType, StateType, ActionType }
```

[⇧ back to top](#table-of-contents)

### getState

Key Point: [State variable not updating in useEffect callback](https://github.com/facebook/react/issues/14066)
To solve it, we provide a way to get the current state of model: getState

Note: the getState method cannot invoke the dom changes automatically by itself.

> Hint: The state returned should only be used as readonly

```jsx
import { useStore, getState } from '../model/index.model'

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

## Advance Concept

### immutable Actions

The actions use [immer](https://github.com/mweststrate/immer) produce API to modify the Store. You can return a producer in action.

TypeScript Example

```ts
// StateType and ActionsParamType definition
// ...

const Model: ModelType<StateType, ActionsParamType> = {
  actions: {
    increment: async (s, _, params) => {
      // issue: https://github.com/Microsoft/TypeScript/issues/29196
      // async function return produce need define type manually.
      return (state: typeof s) => {
        state.counter += params || 1
      }
    },
    decrease: (s, _, params) => s => {
      s.counter += params || 1
    }
  }
}
```

JavaScript Example

```js
const Model = {
  actions: {
    increment: async (s, _, params) => {
      return state => {
        state.counter += params || 1
      }
    }
  }
}
```

[⇧ back to top](#table-of-contents)

### SSR with Next.js

`shared.model.ts`

```ts
const initialState = {
  counter: 0
}

const Model: ModelType<StateType, ActionsParamType> = {
  actions: {
    increment: (state, _, params) => {
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
```

`_app.tsx`

```tsx
import { models, getInitialState, Models } from '../model/index.model'

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
      await getInitialState() // get all model initialState
      // : await getInitialState({ modelName: 'Home' }) // get Home initialState only
      // : await getInitialState({ modelName: ['Home', 'Todo'] }) // get multi initialState
      // : await getInitialState({ data }) // You can also pass some public data as asyncData params.
    return { initialModels }
  } else {
    return { persistModel }
  }
}
```

`hooks/index.tsx`

```tsx
import { useStore, getState } from '../index.model'
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

`benchmark.tsx`

```tsx
// ...
Benchmark.getInitialProps = async () => {
  return await getInitialState({ modelName: 'Todo' })
}
```

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

## Other Concept required by Class Component ( Not First Class, ONLY SUPPORT ON CSR, Welcome to PR )

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

Javascript decorator version

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

TypeScript Version

```tsx
import React, { PureComponent } from 'react'
import { Provider, connect } from 'react-model'
import { StateType, ActionType } from '../model/home.model'

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

[⇧ back to top](#table-of-contents)
