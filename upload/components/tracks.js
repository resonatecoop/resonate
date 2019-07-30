const Component = require('choo/component')
const html = require('choo/html')
const clone = require('shallow-clone')
const nanostate = require('nanostate')
const nanologger = require('nanologger')
const Loader = require('./play-count')
const compare = require('nanocomponent/compare')
const Pagination = require('@resonate/pagination')

class Tracks extends Component {
  constructor (id, state, emit) {
    super(id)

    this.id = id
    this.local = state.components[id] = {}
    this.state = state
    this.emit = emit

    this.items = []

    this.renderTracks = this.renderTracks.bind(this)
    this.renderError = this.renderError.bind(this)
    this.renderPlaceholder = this.renderPlaceholder.bind(this)

    this.log = nanologger(id)

    this.local.machine = nanostate('idle', {
      idle: { start: 'loading', resolve: 'data' },
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
      this.log.info('loader:toggle', this.local.loader.state.loader)
      if (this.element) this.rerender()
    })

    this.local.machine.on('notFound', () => {
      this.log.info('notFound')
      if (this.element) this.rerender()
    })

    this.local.machine.on('loading', () => {
      this.log.info('loading')
    })

    this.local.machine.on('error', () => {
      this.log.error('error')
      if (this.element) this.rerender()
    })

    this.local.machine.on('data', () => {
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
        off: () => void 0
      }[this.local.loader.state.loader](),
      notFound: this.renderPlaceholder(),
      error: this.renderError()
    }[this.local.machine.state] || this.renderTracks()

    let paginationEl

    if (paginationEnabled) {
      paginationEl = new Pagination(this.id + '-pagination', this.state, this.emit).render({
        navigate: function (pageNumber) {
          self.emit(self.state.events.PUSHSTATE, self.state.href + `?page=${pageNumber}`)
        },
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
          <button class="grow dim" onclick=${() => {
    this.emit('labels:reload', this.state.params.id)
  }}>Try again</button>
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
      <div class="flex flex-column flex-auto items-center justify-center" style="min-height:100vh;">
        ${loader}
      </div>
    `
  }

  renderTracks () {
    const trackItem = (track, index) => {
      const { cover, title } = track

      return html`
        <article class="dt w-100 bb b--black-05 pb2 mt2" href="#0">
          <div class="dtc w2 w3-ns v-mid">
            <img src="https://static.resonate.is/track-artwork/600x600/${cover}" class="ba b--black-10 db br2 w2 w3-ns h2 h3-ns"/>
          </div>
          <div class="dtc v-mid pl3">
            <h1 class="f6 f5-ns fw6 lh-title black mv0">${title}</h1>
          </div>
          <div class="dtc v-mid">
            <form class="w-100 tr">
              <button class="f6 button-reset bg-white ba b--black-10 dim pointer pv1 black-60" type="submit">Edit</button>
            </form>
          </div>
        </article>
      `
    }

    return html`
      <div>
        <h2 class="f3 fw4 pa3 mv0">Tracks</h2>
        <div class="cf pa2">
        </div>

        <div class="mw6 center">
          ${this.items.map(trackItem)}
        </div>
      </div>
    `
  }

  update (props) {
    return compare(this.items, props.items)
  }
}

module.exports = Tracks
