# react-model

The State management library for React

🎉 Support Hooks Api

## Quick Start

Running demo

```
git clone https://github.com/byte-fe/react-model.git
cd react-model/example
yarn
yarn dev
```

install package

```
npm install git+https://github.com/byte-fe/react-model.git#master
```

## Core Concept

### Model Register

react-model keep the state and actions in a global store. So you need to register them before using.

```typescript
import { useCallback, useContext, useEffect, useState } from 'react'
import { registerModel } from '../model'
import Home from '../model/home.model'
import Shared from '../model/shared.model'

registerModel(
  {
    Home,
    Shared
  },
  {
    useState,
    useCallback,
    useEffect,
    useContext
  }
)
```

### useStore

The functional component in React 16.7 can use Hooks to connect the global store.

```javascript
import React from 'react'
import { useStore } from '../model'

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

### Provider

The global state standalone can not effect the react class components, we need to provide the state to react root component.

```jsx
import { PureComponent } from 'react'
import { Provider } from './model'

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
import { Provider, connect } from '../model'

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
import { Provider, connect } from '../model'
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

const Model = {
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
} as ModelType<StateType, ActionsParamType> // The Modal actions type will generate automatically by the StateType and ActionParamsType

export default Model

type ConsumerActionsType = getConsumerActionsType<typeof Model.actions>
type ConsumerType = { actions: ConsumerActionsType; state: StateType }
type ActionType = ConsumerActionsType

export { ConsumerType, StateType, ActionType }
```
