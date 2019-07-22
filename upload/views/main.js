const html = require('choo/html')
const ReleaseForm = require('../components/forms/release-info')

function main (state, emit) {
  return html`
    <div class="flex flex-column w-100 w-75-m w-50-l mh3 mh0-ns mw6">
      <h1 class="lh-title">Upload release</h1>

      ${state.cache(ReleaseForm, 'release-form').render()}
    </div>
  `
}

module.exports = main
