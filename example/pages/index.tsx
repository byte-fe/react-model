import React, { PureComponent } from 'react'
import { Provider, connect, registerModel } from 'react-modelx'
import { StateType, ActionType } from '../model/home.model'
import J from './counter' // JS Version
import H from './hooks'

import Home from '../model/home.model'
import Shared from '../model/shared.model'

registerModel({
  Home,
  Shared
})

export default class App extends PureComponent {
  render() {
    return (
      <Provider>
        <T />
        <J />
        <H />
        <H />
      </Provider>
    )
  }
}

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
    return (
      <>
        <div>TS Counter</div>
        <div>states - {JSON.stringify(this.props.state)}</div>
        <button onClick={e => this.props.actions.increment(3)}>
          increment
        </button>
        <button onClick={e => this.props.actions.openLight()}>
          Light Switch
        </button>
        <button onClick={e => this.props.actions.get()}>Get Response</button>
        <div>message: {JSON.stringify(this.props.state.response)}</div>
      </>
    )
  }
}

const T = connect(
  'Home',
  mapProps
)(TSCounter)
