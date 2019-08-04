const html = require('choo/html')
const Layout = require('../../elements/layout')
const ReleaseCreateForm = require('../../components/forms/releases/create')

module.exports = Layout(view)

function view (state, emit) {
  return html`
    <div class="flex flex-column w-100 w-75-m w-50-l mh3 mh0-ns mw6">
      ${state.cache(ReleaseCreateForm, 'release-update-form').render({ data: state.release.data || {} })}
    </div>
  `
}
