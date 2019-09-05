type CounterState = {
  count: number
}

type ExtState = {
  name: string
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

type ExtActionParams = {
  ext: undefined
}

type NextCounterActionParams = {
  increment: number
  add: number
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
