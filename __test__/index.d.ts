type CounterState = {
  count: number
}

type ThemeState = {
  theme: 'dark' | 'light'
}

type ActionTesterState = {
  response: { data: Object }
  data: Object
}

type CounterActionParams = {
  increment: number
}

type ExtraActionParams = {
  add: number
}

type ThemeActionParams = {
  changeTheme: 'dark' | 'light'
}

type ActionTesterParams = {
  get: undefined
  parse: undefined
  getData: undefined
}
