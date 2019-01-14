import * as React from 'react'
import { withRouter, RouterProps } from 'next/router'
import { Container, AppProps, DefaultAppIProps, NextAppContext } from 'next/app'
import { Model } from '../lib/index'

import Home from '../model/home.model'
import Shared from '../model/shared.model'

let initialModel: any

const models = { Home, Shared }

export const { getInitialState, useStore, getState } = Model(models)
const MyApp = (props: AppProps & DefaultAppIProps & RouterProps) => {
  if (!(process as any).browser) {
    initialModel = Model(models, (props as any).initialModels) // TypeScript Support will release later.
  } else {
    initialModel =
      (props as any).initialModel || Model(models, (props as any).initialModels)
  }
  const { Component, pageProps, router } = props
  return (
    <Container>
      <Component {...pageProps} useStore={useStore} getState={getState} />
    </Container>
  )
}

MyApp.getInitialProps = async (context: NextAppContext) => {
  if (!(process as any).browser) {
    const initialModels = await getInitialState()
    return { initialModels }
  } else {
    return { initialModel }
  }
}

export default withRouter(MyApp)
