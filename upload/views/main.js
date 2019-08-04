const html = require('choo/html')
const ReleaseCreateForm = require('../components/forms/releases/create')

function main (state, emit) {
  const form = state.cache(ReleaseCreateForm, 'release-create-form').render({
    data: state.data
  })
  return html`
    <div class="flex flex-column w-100 w-75-m w-50-l mh3 mh0-ns mw6">
      <h1 class="lh-title">Upload release</h1>

      ${form}
    </div>
  `
}

module.exports = main
