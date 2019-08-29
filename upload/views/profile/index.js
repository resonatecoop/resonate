const html = require('choo/html')
const Layout = require('../../elements/layout')

module.exports = Layout(view)

function view (state, emit) {
  return html`
    <div class="flex flex-column w-100 mh3 mh0-ns">
      <h2 class="lh-title">Edit your profile</h2>
    </div>
  `
}
