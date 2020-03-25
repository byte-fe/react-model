/// <reference path="../index.d.ts" />
import * as React from 'react'
import { Model, Provider, connect } from '../../src'
import { Counter } from '../index'
import { render, fireEvent } from '@testing-library/react'
import { timeout } from '../../src/helper'

const Button = connect(
  'Counter',
  (props: any) => props
)(
  class extends React.PureComponent<any> {
    render() {
      const { state, actions } = this.props
      return (
        <button
          onClick={() => {
            actions.increment(3).catch((e: any) => console.error(e))
          }}
        >
          {state.count}
        </button>
      )
    }
  }
)

describe('class component', () => {
  test('Provider', () => {
    Model({ Counter })
    const { container } = render(
      <Provider>
        <Button />
      </Provider>
    )
    const button = container.firstChild
    expect(button!.textContent).toBe('0')
  })
  test('Consumer', async () => {
    Model({ Counter })
    const { container } = render(
      <Provider>
        <Button />
      </Provider>
    )
    const button: any = container.firstChild
    expect(button!.textContent).toBe('0')
    fireEvent.click(button)
    await timeout(100, {}) // Wait Consumer rerender
    expect(button!.textContent).toBe('3')
  })
})
