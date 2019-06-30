const html = require('choo/html')
const Artists = require('../../components/artists')
const breadcrumb = require('../../elements/breadcrumb')
const viewLayout = require('../../elements/view-layout')

module.exports = LabelArtistsView

function LabelArtistsView () {
  return (state, emit) => {
    const id = Number(state.params.uid)

    if (isNaN(id)) return emit(state.events.PUSHSTATE, '/')

    const { items = [], numberOfPages = 1 } = state.label.artists

    const artists = state.cache(Artists, 'label-artists-' + id).render({
      items,
      numberOfPages,
      pagination: numberOfPages > 1
    })

    return viewLayout((state, emit) => html`
      <section id="artist-profile" class="flex flex-column flex-auto w-100">
        <section id="content" class="flex flex-column flex-auto w-100 pb6 ph3">
          ${breadcrumb({ href: `/labels/${id}`, text: 'Back to label profile' })}
          <section id="label-artists" class="flex-auto">
            <h2 class="lh-title ml3">Artists</h2>
            ${artists}
          </section>
        </section>
      </section>
    `)(state, emit)
  }
}
