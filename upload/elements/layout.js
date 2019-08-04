const html = require('choo/html')
const Header = require('../components/header')
const Login = require('../components/login')

function Layout (view) {
  return (state, emit) => {
    const header = state.cache(Header, 'header').render({
      href: state.href,
      user: state.user
    })

    const login = () => state.cache(Login, 'login').render({
      user: state.user
    })

    return html`
      <div id="app">
        ${header}
        ${state.user.resolved && !state.user.data.id ? login() : ''}
        <main class="flex justify-center" role="main">
          ${view(state, emit)}
        </main>
      </div>
    `
  }
}

module.exports = Layout
