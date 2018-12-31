# react-modelx &middot; ![GitHub license](https://img.shields.io/badge/license-MIT-blue.svg) [![npm version](https://img.shields.io/npm/v/react-modelx.svg?style=flat)](https://www.npmjs.com/package/react-modelx) [![size](http://img.badgesize.io/https://cdn.jsdelivr.net/npm/react-modelx/dist/index.js?compression=gzip)](http://img.badgesize.io/https://cdn.jsdelivr.net/npm/react-modelx/dist/index.js) [![install size](https://packagephobia.now.sh/badge?p=react-modelx)](https://packagephobia.now.sh/result?p=react-modelx) ![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)

The State management library for React

🎉 Support Hooks Api

👬 Fully TypeScript Support

## Quick Start

[Next.js + react-modelx work around](https://github.com/ArrayZoneYour/react-modelx-experiment)

install package

```
npm install react-modelx
```

## Core Concept

### Model Register

react-model keep the state and actions in a global store. So you need to register them before using.

```typescript
import { Model } from 'react-modelx'
import Home from '../model/home.model'
import Shared from '../model/shared.model'

const models = { Home, Shared }

export const { useStore } = Model(models)
```

### useStore

The functional component in React 16.7 can use Hooks to connect the global store.

```javascript
import React from 'react'
import { useStore } from './index'

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

type ConsumerActionsType = getConsumerActionsType<typeof Model.actions>
type ConsumerType = { actions: ConsumerActionsType; state: StateType }
type ActionType = ConsumerActionsType

export { ConsumerType, StateType, ActionType }
```

### getState

Key Point: [State variable not updating in useEffect callback](https://github.com/facebook/react/issues/14066)
To solve it, we provide a way to get the current state of model: getState

> Hint: The state returned should only be used as readonly

```jsx
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

## Other Concept required by Class Component

### Provider

The global state standalone can not effect the react class components, we need to provide the state to react root component.

```jsx
import { PureComponent } from 'react'
import { Provider } from 'react-modelx'

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

### connect

We can use the Provider state with connect.

Javascript decorator version

```jsx
import React, { PureComponent } from 'react'
import { Provider, connect } from 'react-modelx'

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
import { Provider, connect } from 'react-modelx'
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
