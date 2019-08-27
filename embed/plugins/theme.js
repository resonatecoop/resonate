const { isBrowser } = require('browser-or-node')

module.exports = theme

function theme () {
  return (state, emitter) => {
    if (!isBrowser) return

    if (window.localStorage.getItem('color-scheme')) {
      const theme = window.localStorage.getItem('color-scheme')
      document.body.classList.add(`color-scheme--${theme}`)
      state.theme = theme
    } else {
      state.theme = 'light'
    }
  }
}
