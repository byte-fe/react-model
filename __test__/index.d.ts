type CounterState = {
  count: number
}

type ThemeState = {
  theme: 'dark' | 'light'
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
