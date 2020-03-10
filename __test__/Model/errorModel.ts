// Use to simulate a error model.js file
export const ErrorModel: any = {
  actions: {
    // @ts-ignore
    add: (params, { state }) => {
      return {
        count: state.count + params
      }
    },
    // @ts-ignore
    addCaller: (_, { actions }) => {
      actions.add(5)
    },
    // @ts-ignore
    increment: params => {
      // @ts-ignore
      return state => {
        state.count += params
      }
    },
    state: { count: 0 }
  }
}
