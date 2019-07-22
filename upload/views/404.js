const html = require('choo/html')
const Layout = require('../elements/layout')

module.exports = Layout(view)

function view (state, emit) {
  return html`
    <div class="flex flex-column w-100 w-75-m w-50-l mh3 mh0-ns mw6">
      <h1 class="lh-title">404</h1>

      <a href="/">Home</a><br>
    </div>
  `
}
