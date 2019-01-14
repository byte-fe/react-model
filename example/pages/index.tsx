import React, { PureComponent } from 'react'
import { Provider, connect } from '../lib/index'
import { ModelProps } from '../model/index.model'
import { StateType, ActionType } from '../model/home.model'
import H from './hooks'

export default class App extends PureComponent<ModelProps> {
  render() {
    return (
      <Provider>
        <H {...this.props} />
        <H {...this.props} />
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
