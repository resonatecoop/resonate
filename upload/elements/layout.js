const html = require('choo/html')
const Header = require('../components/header')

function Layout (view) {
  return (state, emit) => {
    const header = state.cache(Header, 'header').render({
      href: state.href
    })

    return html`
      <div id="app">
        ${header}
        <main class="flex justify-center" role="main">
          ${view(state, emit)}
        </main>
      </div>
    `
  }
}

module.exports = Layout
