const assert = require('assert')
const html = require('nanohtml')
const Component = require('nanocomponent')
const compare = require('nanocomponent/compare')
const nanologger = require('nanologger')
const nanostate = require('nanostate')
const clone = require('shallow-clone')
const Loader = require('@resonate/play-count')
const renderCounter = require('@resonate/counter')
const Track = require('@resonate/track-component')
const Pagination = require('@resonate/pagination')
const ResponsiveContainer = require('resize-observer-component')
const icon = require('@resonate/icon-element')
const { iconFill } = require('@resonate/theme-skins')

const noop = () => {}

/*
 * Component for interacting with tracks
 */

class Playlist extends Component {
  constructor (id, state, emit) {
    super(id)

    this.emit = emit
    this.state = state
    this.id = id
    this.local = state.components[id] = {}

    this.log = nanologger(id)

    this.renderPlaylist = this.renderPlaylist.bind(this)
    this.renderLoader = this.renderLoader.bind(this)
    this.renderPlaceholder = this.renderPlaceholder.bind(this)

    this.local.machine = nanostate('idle', {
      idle: { start: 'loading' },
      loading: { resolve: 'idle', reject: 'error' },
      error: { start: 'idle' }
    })

    this.local.machine.event('notFound', nanostate('notFound', {
      notFound: { start: 'idle' }
    }))

    this.local.events = nanostate.parallel({
      loader: nanostate('off', {
        on: { off: 'off' },
        off: { on: 'on' }
      })
    })

    this.local.machine.on('notFound', () => {
      if (this.element) this.rerender()
    })

    this.local.events.on('loader:on', () => {
      if (this.element) this.rerender()
    })

    this.local.events.on('loader:off', () => {
      this.loader.stop()
      if (this.element) this.rerender()
    })
  }

  createElement (props) {
    assert(Array.isArray(props.playlist), 'props.playlist must be an array')

    const self = this

    this.pagination = props.pagination

    const { pagination: paginationEnabled, playlist: items } = props

    this.fetch = props.fetch || noop
    this.playlist = clone(items)
    this.various = props.various || false

    this.type = props.type || 'default' // default | album
    this.style = props.style

    const numberOfPages = props.numberOfPages || 1

    const playlist = {
      loading: {
        on: this.renderLoader
      }[this.local.events.state.loader],
      error: this.renderError,
      notFound: this.renderPlaceholder
    }[this.local.machine.state]

    if (typeof playlist === 'function') return playlist()

    const container = new ResponsiveContainer()

    const showPagination = paginationEnabled && numberOfPages > 1

    const paginationEl = showPagination ? new Pagination([this.id, 'pagination'].join('-'), this.state, this.emit).render({
      navigate: function (pageNumber) {
        self.emit(self.state.events.PUSHSTATE, self.state.href + `?page=${pageNumber}`)
      },
      numberOfPages
    }) : ''

    return container.render(html`
      <div class="flex flex-column flex-auto pt2 pb5">
        ${this.renderPlaylist()}
        ${paginationEl}
      </div>
    `)
  }

  renderPlaylist () {
    const self = this

    return html`
      <ul class="playlist flex flex-auto flex-column list ma0 pa0">
        ${this.playlist.map(playlistItem)}
      </ul>
    `

    function playlistItem (item, index) {
      const trackItem = new Track(`${self.id}-item-${item.track.id}`, self.state, self.emit)
      return trackItem.render({
        type: self.type,
        showArtist: self.type !== 'album' ? true : !!self.various,
        count: item.count,
        fav: item.fav,
        index: index + 1,
        src: item.url,
        track: item.track,
        trackGroup: item.track_group,
        playlist: self.playlist
      })
    }
  }

  renderError () {
    return html`
      <div class="flex flex-column items-center justify-center">
        <p>Failed to fetch tracks</p>
        <div>
          <button onclick=${() => this.local.machine.emit('start')}>Try again</button>
        </div>
      </div>
    `
  }

  renderPlaceholder () {
    const message = {
      owned: 'You don\'t own any tracks yet',
      favorites: 'You don\'t have any favorites',
      history: 'You haven\'t played any tracks yet'
    }[this.type] || 'No tracks to display'

    return html`
      <div class="flex flex-column">
        <div class="flex justify-center items-center mt3">
          ${icon('info', { class: `icon icon--sm ${iconFill}` })}
          <p class="lh-copy pl3">${message}</p>
        </div>
      </div>
    `
  }

  renderLoader () {
    const counter = renderCounter('playlist-loader', { scale: 3, strokeWidth: 1 })
    this.loader = new Loader(3, { animate: true, repeat: true, reach: 9, fps: 10 })
    this.loader.counter = counter

    return html`
      <div class="flex flex-column flex-auto items-center justify-center">
        ${this.loader.counter}
      </div>
    `
  }

  unload () {
    if (this.loader) {
      this.loader.stop()
    }
  }

  update (props) {
    return compare(this.playlist, props.playlist)
  }
}

module.exports = Playlist
