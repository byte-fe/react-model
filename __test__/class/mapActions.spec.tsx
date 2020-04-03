/// <reference path="../index.d.ts" />
import * as React from 'react'
import { Model, Provider, connect } from '../../src'
import { Counter } from '..'
import { render } from '@testing-library/react'

const Button = connect(
  'Counter',
  (props: any) => props,
  (actions: any) => {
    REACT_MODEL: actions
  }
)(
  class extends React.PureComponent<any> {
    render() {
      const { state, REACT_MODEL, buttonName = '' } = this.props
      return (
        <button
          onClick={() => {
            REACT_MODEL.actions.increment(3).catch((e: any) => console.error(e))
          }}
        >
          {buttonName}
          {state.count}
        </button>
      )
    }
  }
)

describe('class component', () => {
  test('render props', () => {
    Model({ Counter })
    const { container } = render(
      <Provider>
        <Button buttonName="button" />
      </Provider>
    )
    const button = container.firstChild
    expect(button!.textContent).toBe('button0')
  })
})
