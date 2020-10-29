const html = require('choo/html')
const Artists = require('../../components/artists')
const { background } = require('@resonate/theme-skins')
const viewLayout = require('../../elements/view-layout')

module.exports = ArtistsView

function ArtistsView () {
  return (state, emit) => {
    const artists = state.cache(Artists, 'artists').render({
      items: state.artists.items,
      numberOfPages: state.artists.numberOfPages
    })

    return viewLayout((state, emit) => html`
      <section id="artists" class="${background} flex flex-column flex-auto w-100 pb6 ph3">
        ${artists}
      </section>
    `
    )(state, emit)
  }
}
