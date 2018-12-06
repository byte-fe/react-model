import React, { PureComponent } from 'react'
import { Provider, connect } from 'react-modelx'

const mapProps = ({ light, counter }) => ({
  lightStatus: light ? 'open' : 'close',
  counter
})

@connect(
  'Home',
  mapProps
)
export default class JSCounter extends PureComponent {
  render() {
    return (
      <>
        <div>states - {JSON.stringify(this.props.state)}</div>
        <button onClick={e => this.props.actions.increment(5)}>
          increment
        </button>
        <button onClick={e => this.props.actions.openLight()}>
          Light Switch
        </button>
      </>
    )
  }
}
