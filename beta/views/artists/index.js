const { isNode } = require('browser-or-node')
const html = require('choo/html')
const Artists = require('../../components/artists')
const viewLayout = require('../../elements/view-layout')

module.exports = ArtistsView

function ArtistsView () {
  return (state, emit) => {
    if (isNode) emit('prefetch:artists')

    const artists = state.cache(Artists, 'artists').render({
      items: state.artists.items,
      numberOfPages: state.artists.numberOfPages
    })

    return viewLayout((state, emit) => html`
      <section id="artists" class="flex flex-column flex-auto w-100 pb6">
        ${artists}
      </section>
    `
    )(state, emit)
  }
}
