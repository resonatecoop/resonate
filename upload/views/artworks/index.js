const html = require('choo/html')
const Layout = require('../../elements/layout')
const Artworks = require('../../components/artworks')

module.exports = Layout(view)

/**
 * Complete list of artist tracks (with play and favorite counts)
 */

function view (state, emit) {
  return html`
    <div class="flex flex-column w-100 mh3 mh0-ns">
      ${state.cache(Artworks, 'artworks').render({ items: state.artworks.items })}
    </div>
  `
}
