const Component = require('choo/component')
const compare = require('nanocomponent/compare')
const html = require('choo/html')
const clone = require('shallow-clone')
const nanostate = require('nanostate')
const nanologger = require('nanologger')
const Loader = require('./play-count')
const Pagination = require('@resonate/pagination')
const css = require('sheetify')
const prefix = css`
  @custom-media --breakpoint-not-small screen and (min-width: 30em);
  @custom-media --breakpoint-medium screen and (min-width: 30em) and (max-width: 60em);
  @custom-media --breakpoint-large screen and (min-width: 60em);

  @media(--breakpoint-large) {
    :host:first-child {
      width: 40%;
      margin-bottom: -1px;
    }
  }
`

class LabelItem extends Component {
  createElement (props) {
    const { avatar: image = {}, id, name } = props
    const fallback = image.original || '/assets/default.png'
    const { large: imageUrl = fallback } = image

    return html`
      <li class="${prefix} fl w-50 w-third-m w-20-l pa3 grow">
        <a class="db aspect-ratio aspect-ratio--1x1 bg-dark-gray" href="/labels/${id}">
          <img aria-label=${name} src=${imageUrl} decoding="auto" class="aspect-ratio--object">
          <span class="absolute bottom-0 truncate w-100 h2" style="top:100%;">
            ${name}
          </span>
        </a>
      </li>
    `
  }

  update () {
    return false
  }
}

class Labels extends Component {
  constructor (id, state, emit) {
    super(id)

    this.state = state
    this.emit = emit
    this.local = state.components[id] = {}

    this.log = nanologger(id)

    this.items = []

    this.renderLabels = this.renderLabels.bind(this)
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

  createElement (props = {}) {
    const self = this
    const { items = [], pagination: paginationEnabled = true, numberOfPages = 1 } = props

    this.items = clone(items)

    const labels = {
      loading: {
        on: this.renderLoader,
        off: () => {}
      }[this.local.loader.state.loader](),
      notFound: this.renderPlaceholder(),
      error: this.renderError()
    }[this.local.machine.state] || this.renderLabels()

    let paginationEl

    if (paginationEnabled && numberOfPages > 1) {
      paginationEl = new Pagination('labels-pagination', this.state, this.emit).render({
        navigate: function (pageNumber) {
          self.emit(self.state.events.PUSHSTATE, self.state.href + `?page=${pageNumber}`)
        },
        numberOfPages
      })
    }

    return html`
      <div class="flex flex-column flex-auto w-100">
        ${labels}
        ${paginationEl}
      </div>
    `
  }

  renderLabels () {
    const items = this.items.map(({ avatar, id, name }) => {
      return new LabelItem().render({ avatar, id, name })
    })
    return html`
      <ul class="labels list ma0 pa0 cf">
        ${items}
      </ul>
    `
  }

  renderError () {
    return html`
      <div class="flex flex-column flex-auto w-100 items-center justify-center">
        <p>Failed to fetch labels</p>
      </div>
    `
  }

  renderPlaceholder () {
    return html`
      <div class="flex flex-column flex-auto w-100 items-center justify-center">
        <p class="tc">No labels found</p>
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
      return compare(props.items, this.items)
    }
    return false
  }
}

module.exports = Labels
