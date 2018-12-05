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
}

const Model = {
  actions: {
    increment: (state, _, params) => {
      return {
        counter: state.counter + (params || 1)
      }
    },
    openLight: (state, actions) => {
      actions.increment(100)
      actions.get()
      actions.increment(10)
      return { light: !state.light }
    },
    get: () => ({ response: { code: 200, message: 'open light success' } })
  },
  state: initialState
} as ModelType<StateType, ActionsParamType>

export default Model

type ConsumerActionsType = getConsumerActionsType<typeof Model.actions>
type ConsumerType = { actions: ConsumerActionsType; state: StateType }
type ActionType = ConsumerActionsType

export { ConsumerType, StateType, ActionType }
