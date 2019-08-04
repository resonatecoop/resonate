const html = require('choo/html')
const Layout = require('../../elements/layout')
const Tracks = require('../../components/tracks')
const icon = require('@resonate/icon-element')

module.exports = Layout(view)

/**
 * Display a release
 */

function view (state, emit) {
  return html`
    <div class="flex flex-column w-100 w-75-m w-50-l mh3 mh0-ns mw6">
      ${state.release.data.id ? renderRelease(state) : ''}
    </div>
  `

  function renderRelease (state) {
    const { cover, title } = state.release.data

    const tracks = state.cache(Tracks, 'tracks').render({
      items: state.release.data.tracks,
      pagination: false
    })

    return html`
      <div class="cf pa2">
        <div class="fl w-100">
          <img src="https://static.resonate.is/track-artwork/600x600/${cover}" alt="${title} Album Cover" class="w-100 db outline black-10"/>
          <h1 class="lh-title f4 f3-l ml0 truncate w-100">${title}</h1>
        </div>

        <h2 class="lh-title ml0">Tracks</h2>

        ${tracks}
      </div>
    `
  }
}
