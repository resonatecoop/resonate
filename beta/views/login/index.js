const html = require('choo/html')
const Login = require('../../components/forms/login')
const Grid = require('../../components/artists/random-grid')
const icon = require('@resonate/icon-element')
const { background, iconFill } = require('@resonate/theme-skins')

module.exports = loginView

function loginView () {
  return (state, emit) => {
    const grid = state.cache(Grid, 'random-artists-grid').render()
    const login = state.cache(Login, 'login').render()

    return html`
      <div class="flex flex-column flex-auto w-100">
        ${grid}
        <div class="flex flex-column flex-auto items-center justify-center min-vh-100 mh3 pv6">
          <div class="${background} z-1 w-100 w-auto-l shadow-contour ph4 pt4 pb3">
            <a href="/login">
              ${icon('logo', { class: `icon icon--lg ${iconFill}` })}
            </a>
            <h1 class="f3 fw1 mt2 near-black near-black--light light-gray--dark lh-title">Login</h1>
            ${login}
          </div>
        </div>
      </div>
    `
  }
}
