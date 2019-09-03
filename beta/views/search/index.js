const html = require('choo/html')
const matchMedia = require('../../lib/match-media')
const Playlist = require('@resonate/playlist-component')
const Artists = require('../../components/artists')
const Labels = require('../../components/labels')
const viewLayout = require('../../elements/view-layout')

module.exports = SearchView

function SearchView () {
  return (state, emit) => {
    const playlist = state.cache(Playlist, 'playlist-search')
    const notFound = state.search.notFound

    const results = Object.entries(state.search.results)
      .filter(([key, value]) => {
        if (!value) return false
        if (value.length) return true
      }).map(([key, value]) => ({
        key,
        data: state.search.results[key],
        count: state.search.results[key].length
      }))

    const defaultTab = state.search.results.tracks.length ? 'tracks' : state.search.results.labels.length ? 'labels' : 'artists'

    const tabView = {
      artists: () => {
        const artists = new Artists('artists-search', state, emit)
        return artists.render({
          items: state.search.results.artists,
          pagination: false
        })
      },
      labels: () => {
        const labels = new Labels('labels-search', state, emit)
        return labels.render({
          items: state.search.results.labels
        })
      },
      tracks: () => playlist.render({
        playlist: state.search.results.tracks
      })
    }[state.params.tab || defaultTab]

    return viewLayout((state, emit) => html`
      <div class="flex flex-column w-100">
        ${tabNavigation({ items: results })}
        <section class="flex flex-column flex-auto w-100 ph3 pb6">
          ${notFound ? renderPlaceholder('No results found') : tabView ? tabView() : ''}
        </section>
      </div>
    `
    )(state, emit)

    function tabNavigation (props) {
      const { items: tabs } = props
      return html`
        <ul class="menu sticky-ns flex w-100 list ma0 pa0 z-3" style="top:${matchMedia('lg') ? 108 : 0}px;">
          ${tabs.map(({ key: name, count }, index) => {
        return html`
              <li class="flex flex-auto ${state.href.includes(name) || (index === 0 && state.route === 'artists/:id') ? 'active' : ''}">
                <a href="/search/${state.params.q}/${name}" class="relative flex items-center justify-center ttc bb bw1 color-inherit focus--green w-100 h-100 b--transparent bg-transparent pv0 ph3 ma0 no-underline" title="${count} ${name} results">${name}</a>
              </li>
            `
      })}
        </ul>
      `
    }

    function renderPlaceholder (message) {
      return html`
        <div class="flex justify-center">
          <p>${message}</p>
        </div>
      `
    }
  }
}
