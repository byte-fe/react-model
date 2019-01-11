import * as React from 'react'
import { withRouter, RouterProps } from 'next/router'
import { Container, AppProps, DefaultAppIProps, NextAppContext } from 'next/app'
import { Model } from '../lib/index'

import Home from '../model/home.model'
import Shared from '../model/shared.model'
export const { getInitialState } = Model({ Home, Shared })

const MyApp = (props: AppProps & DefaultAppIProps & RouterProps) => {
  const initialModel = Model({ Home, Shared }, (props as any).initialModels)
  const { Component, pageProps, router } = props
  return (
    <Container>
      <Component {...pageProps} {...initialModel} />
    </Container>
  )
}

MyApp.getInitialProps = async (context: NextAppContext) => {
  context
  const initialModels = await getInitialState()
  return {
    initialModels
  }
}

export default withRouter(MyApp)
