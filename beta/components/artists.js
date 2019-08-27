const Nanocomponent = require('choo/component')
const compare = require('nanocomponent/compare')
const html = require('choo/html')
const clone = require('shallow-clone')
const Artist = require('./artist')
const nanostate = require('nanostate')
const nanologger = require('nanologger')
const Loader = require('./play-count')
const Pagination = require('@resonate/pagination')

class Artists extends Nanocomponent {
  constructor (id, state, emit) {
    super(id)

    this.items = []

    this.state = state
    this.emit = emit
    this.local = state.components[id] = {}

    this.log = nanologger(id)

    this.renderArtists = this.renderArtists.bind(this)
    this.renderError = this.renderError.bind(this)
    this.renderPlaceholder = this.renderPlaceholder.bind(this)

    this.local.machine = nanostate('idle', {
      idle: { start: 'loading', resolve: 'idle' },
      loading: { resolve: 'idle', reject: 'error' },
      error: { start: 'idle' }
    })

    this.local.machine.event('notFound', nanostate('notFound', {
      notFound: { start: 'idle' }
    }))

    this.local.loader = nanostate.parallel({
      loader: nanostate('off', {
        on: { toggle: 'off' },
        off: { toggle: 'on' }
      })
    })

    this.local.loader.on('loader:toggle', () => {
      if (this.element) this.rerender()
    })

    this.local.machine.on('notFound', () => {
      if (this.element) this.rerender()
    })

    this.local.machine.on('error', () => {
      if (this.element) this.rerender()
    })
  }

  createElement (props = {}) {
    const self = this
    const { numberOfPages = 1, pagination: paginationEnabled = true } = props

    this.local.shuffle = props.shuffle
    this.local.items = props.items || []

    const artists = {
      loading: {
        on: this.renderLoader,
        off: () => {}
      }[this.local.loader.state.loader](),
      notFound: this.renderPlaceholder(),
      error: this.renderError()
    }[this.local.machine.state] || this.renderArtists()

    let paginationEl

    if (paginationEnabled) {
      paginationEl = new Pagination('artists-pagination', this.state, this.emit).render({
        navigate: function (pageNumber) {
          const path = !/artists/.test(this.state.href) ? '/artists' : ''
          self.emit(self.state.events.PUSHSTATE, self.state.href + `${path}?page=${pageNumber}`)
        },
        path: !/artists/.test(this.state.href) ? '/artists' : '',
        numberOfPages
      })
    }

    return html`
      <div class="flex flex-column flex-auto w-100">
        ${artists}
        ${paginationEl}
      </div>
    `
  }

  renderArtists () {
    const self = this

    let items = clone(this.local.items)

    if (this.local.shuffle) {
      items = items.sort(() => Math.random() - 0.5)
    }

    return html`
      <ul class="artists list ma0 pa0 cf">
        ${items.map(artistItem)}
      </ul>
    `

    function artistItem (props) {
      const { id } = props
      const artist = self.state.cache(Artist, `artist-item-${id}`)
      return artist.render(props)
    }
  }

  renderError () {
    return html`
      <div class="flex flex-column flex-auto w-100 items-center justify-center">
        <p>Failed to fetch artists</p>
        <div>
          <button onclick=${() => this.emit('labels:reload', this.state.params.id)}>Try again</button>
        </div>
      </div>
    `
  }

  renderPlaceholder () {
    return html`
      <div class="flex flex-column flex-auto w-100 items-center justify-center">
        <p class="tc">👽 No artists found</p>
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
      <div class="flex flex-column flex-auto items-center justify-center h5">
        ${loader}
      </div>
    `
  }

  update (props) {
    if (props) {
      return compare(props.items, this.local.items)
    }
    return false
  }
}

module.exports = Artists
