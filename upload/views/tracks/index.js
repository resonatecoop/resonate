const html = require('choo/html')
const Layout = require('../../elements/layout')
const Tracks = require('../../components/tracks')

module.exports = Layout(view)

/**
 * Complete list of artist tracks (with play and favorite counts)
 */

function view (state, emit) {
  const tracks = state.cache(Tracks, 'tracks').render({
    items: state.tracks.items,
    numberOfPages: state.tracks.numberOfPages
  })

  return html`
    <div class="flex flex-column w-100 mh3 mh0-ns">
      ${tracks}
    </div>
  `
}
