const { isBrowser } = require('browser-or-node')

module.exports = theme

function theme (options = {}) {
  const { iframe = false } = options

  return (state, emitter) => {
    if (!isBrowser) return

    if (window.localStorage.getItem('color-scheme')) {
      const theme = window.localStorage.getItem('color-scheme')
      document.body.classList.add(`color-scheme--${theme}`)
      state.theme = theme
    } else {
      state.theme = 'light'
    }

    emitter.on('theme', (props) => {
      const { theme = 'light', auto = false } = props

      if (!auto) {
        document.body.classList.toggle('color-scheme--light', theme === 'light')
        document.body.classList.toggle('color-scheme--dark', theme === 'dark')

        state.theme = theme

        if (!iframe) {
          window.localStorage.setItem('color-scheme', theme)
          window.localStorage.setItem('color-scheme-auto', false)
        }
      } else {
        document.body.classList.remove('color-scheme--light')
        document.body.classList.remove('color-scheme--dark')

        state.theme = 'light'

        if (!iframe) {
          window.localStorage.removeItem('color-scheme')
          window.localStorage.setItem('color-scheme-auto', true)
        }
      }
    })
  }
}
