const html = require('choo/html')
const viewLayout = require('../../elements/view-layout')
const FeaturedArtists = require('../../components/featured-artists')
const FeaturedLabels = require('../../components/featured-labels')

module.exports = DashboardView

function DashboardView () {
  return (state, emit) => {
    const featuredArtists = state.cache(FeaturedArtists, 'featured-artists').render({
      title: 'Featured artists',
      ids: JSON.parse(process.env.FEATURED_ARTISTS || '[]')
    })

    const featuredBands = state.cache(FeaturedArtists, 'featured-bands').render({
      title: 'Featured bands',
      ids: JSON.parse(process.env.FEATURED_BANDS || '[]')
    })

    const featuredLabels = state.cache(FeaturedLabels, 'featured-labels').render({
      title: 'Featured labels',
      ids: JSON.parse(process.env.FEATURED_LABELS || '[]')
    })

    return viewLayout((state, emit) => html`
      <section id="features" class="bg-near-white black bg-black--dark white--dark bg-near-white--light black--light flex flex-auto flex-column pb6">
        <section id="featured-artists" class="flex flex-column flex-auto w-100 center">
          ${featuredArtists}
        </section>
        <section id="featured-bands" class="flex flex-column flex-auto w-100 center">
          ${featuredBands}
        </section>
        <section id="featured-labels" class="flex flex-column flex-auto w-100 center">
          ${featuredLabels}
        </section>
      </section>
    `
    )(state, emit)
  }
}
