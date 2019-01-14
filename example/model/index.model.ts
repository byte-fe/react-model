import Home from './home.model'
import Shared from './shared.model'

const models = {
  Home,
  Shared
}

type ModelsType = typeof models
export type ModelProps = ModelsProps<ModelsType>
