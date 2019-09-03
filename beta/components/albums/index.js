const Component = require('choo/component')
const html = require('choo/html')
const clone = require('shallow-clone')
const Playlist = require('@resonate/playlist-component')
const adapter = require('@resonate/schemas/adapters/v1/track')
const nanostate = require('nanostate')
const nanologger = require('nanologger')
const Loader = require('../play-count')
const clock = require('mm-ss')
const compare = require('nanocomponent/compare')
const Pagination = require('@resonate/pagination')

/*
 * Render a list of albums as playlists
 */

class Albums extends Component {
  constructor (id, state, emit) {
    super(id)

    this.id = id
    this.state = state
    this.emit = emit

    this.items = []

    this.renderAlbums = this.renderAlbums.bind(this)
    this.renderError = this.renderError.bind(this)
    this.renderPlaceholder = this.renderPlaceholder.bind(this)

    this.log = nanologger(id)

    this.machine = nanostate('idle', {
      idle: { start: 'loading', resolve: 'data' },
      loading: { resolve: 'data', reject: 'error' },
      data: { start: 'idle', resolve: 'data' },
      error: { start: 'idle' }
    })

    this.machine.event('notFound', nanostate('notFound', {
      notFound: { start: 'idle' }
    }))

    this.loader = nanostate.parallel({
      loader: nanostate('off', {
        on: { toggle: 'off' },
        off: { toggle: 'on' }
      })
    })

    this.loader.on('loader:toggle', () => {
      this.log.info('loader:toggle', this.loader.state.loader)
      if (this.element) this.rerender()
    })

    this.machine.on('notFound', () => {
      this.log.info('notFound')
      if (this.element) this.rerender()
    })

    this.machine.on('loading', () => {
      this.log.info('loading')
    })

    this.machine.on('error', () => {
      this.log.error('error')
      if (this.element) this.rerender()
    })

    this.machine.on('data', () => {
      this.log.info('data')
      if (this.element) this.rerender()
    })
  }

  createElement (props) {
    const self = this

    const { items = [], numberOfPages = 1, pagination: paginationEnabled = true } = props

    this.items = clone(items)

    const albums = {
      loading: {
        on: this.renderLoader,
        off: () => {}
      }[this.loader.state.loader](),
      notFound: this.renderPlaceholder(),
      error: this.renderError()
    }[this.machine.state] || this.renderAlbums()

    let paginationEl

    if (paginationEnabled) {
      paginationEl = new Pagination(this.id + '-pagination', this.state, this.emit).render({
        navigate: function (pageNumber) {
          const path = !/albums/.test(this.state.href) ? '/albums' : ''
          self.emit(self.state.events.PUSHSTATE, self.state.href + `${path}?page=${pageNumber}`)
        },
        path: !/albums/.test(this.state.href) ? '/albums' : '',
        numberOfPages
      })
    }

    return html`
      <div class="flex flex-column flex-auto w-100">
        ${albums}
        ${paginationEl}
      </div>
    `
  }

  renderError () {
    return html`
      <div class="flex flex-column flex-auto w-100 items-center justify-center">
        <p>😱 Failed to fetch albums</p>
        <div>
          <button class="grow dim" onclick=${() => this.emit('labels:reload', this.state.params.id)}}>Try again</button>
        </div>
      </div>
    `
  }

  renderPlaceholder () {
    return html`
      <div class="flex flex-column flex-auto w-100 items-center justify-center">
        <p class="tc">This label has no albums yet</p>
      </div>
    `
  }

  renderLoader () {
    const loader = new Loader().render({
      name: 'loader',
      count: 3,
      options: { animate: true, repeat: true, reach: 9, fps: 10 }
    })
    return html`
      <div class="flex flex-column flex-auto items-center justify-center">
        ${loader}
      </div>
    `
  }

  renderAlbums () {
    const albumItem = (album, index) => {
      const playlist = this.state.cache(Playlist, `${this.id}-album-playlist-${index}`).render({
        type: 'album',
        various: album.various,
        playlist: album.tracks.length ? album.tracks.map(adapter) : []
      })

      const src = album.tracks.length ? album.tracks[0].artwork.large : ''

      return html`
        <article class="mb6 flex flex-column flex-row-l flex-auto">
          <div class="flex flex-column mw5-m mw5-l mb2 w-100">
            <div class="db aspect-ratio aspect-ratio--1x1">
              <span role="img" style="background:url(${src}) no-repeat;" class="bg-center cover aspect-ratio--object z-1">
              </span>
            </div>
          </div>
          <div class="flex flex-column flex-auto pl2-l">
            <header>
              <div class="flex flex-column">
                <h3 class="ma0 lh-title f4 normal">
                  ${album.name}
                </h3>
                <div>
                  ${!album.various ? html`<a href="/artists/${album.uid}" class="link dark-gray">${album.artist}</a>` : html`<span>${album.artist}</span>`}
                </div>
              </div>
            </header>
            ${playlist}
            <div class="flex flex-column pr2 mb2">
              <dl class="flex">
                <dt class="flex-auto w-100 ma0">Running time</dt>
                <dd class="flex-auto w-100 ma0 dark-gray">
                  ${clock(album.duration)}
                </dd>
              </dl>
            </div>
          </div>
        </article>
      `
    }

    return html`
      <ul class="list ma0 pa0">
        ${this.items.map(albumItem)}
      </ul>
    `
  }

  update (props) {
    return compare(this.items, props.items)
  }
}

module.exports = Albums
