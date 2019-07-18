const Nanocomponent = require('choo/component')
const compare = require('nanocomponent/compare')
const html = require('choo/html')
const clone = require('shallow-clone')
const Artist = require('./artist')
const nanostate = require('nanostate')
const nanologger = require('nanologger')
const Loader = require('./play-count')
const Pagination = require('@resonate/pagination')
const icon = require('@resonate/icon-element')
const Dialog = require('@resonate/dialog-component')
const inputEl = require('@resonate/input-element')
const css = require('sheetify')
const button = require('@resonate/button')
const queryString = require('query-string')
const { iconFillInvert } = require('@resonate/theme-skins')

const prefix = css`
  :host input[type="checkbox"]:active ~ label {
    opacity: 1;
  }
  :host input[type="checkbox"]:checked ~ label {
    opacity: 1;
  }
  :host input[type="checkbox"]:checked ~ label .icon {
    fill: var(--near-black);
  }
`

class FilterArtists extends Nanocomponent {
  constructor (id, state, emit) {
    super(id)

    this.state = state
    this.emit = emit
    this.local = state.components[id] = {}

    if (this.state.query.countries) {
      this.local.selection = this.state.query.countries.split(',')
    } else {
      this.local.selection = []
    }

    this.local.input = ''
  }

  createElement (props) {
    this.local.countries = props.countries

    const self = this
    const randomCountries = clone(this.local.countries).sort(() => Math.random() - 0.5)
    const input = inputEl({
      name: 'countries',
      placeholder: randomCountries.slice(0, 3).map((item) => item.country).join(', '),
      value: this.local.input,
      classList: 'indent',
      required: false,
      onInput: (e) => {
        this.local.input = e.target.value
        this.rerender()
      }
    })

    const items = this.local.countries.filter(({ country }) => {
      return country.toLowerCase().includes(this.local.input.toLowerCase())
    }).map(countryItem)

    return html`
      <div class="${prefix}">
        <div class="sticky z-1 top-0">
          <div class="flex relative">
            <label class="search-label flex absolute z-1" for="search" style="left:.5rem;top:50%;transform:translateY(-50%) scaleX(-1);">
              ${icon('search', { 'class': `icon icon--sm ${iconFillInvert}` })}
            </label>
            ${input}
          </div>
        </div>
        ${renderResults(items)}
      </div>
    `

    function countryItem (item, index) {
      const { country, country_code: code, count } = item

      return html`
        <li class="dt w-100 bb b--black-05 pb1">
          <input onchange=${updateSelection} checked=${self.local.selection.includes(code)} id="country-${index}" name='country' value=${code} type="checkbox" class="o-0" style="width:0;height:0;"  />
          <label class="flex justify-center items-center w-100 dim" tabindex="0" onkeypress=${handleKeyPress} for="country-${index}">
            <div class="flex ph2 w-100 items-center flex-auto">
              <div class="flex items-center justify-center h1 w1 ba bw b--mid-gray">
                ${icon('square', { 'class': 'icon icon--sm fill-transparent' })}
              </div>
              <div class="flex">
                <span class="ph2">${country}</span>
              </div>
              <div class="flex flex-auto justify-end">
                <span class="ph2">${count}</span>
              </div>
            </div>
          </label>
        </li>
      `
    }

    function updateSelection (e) {
      const val = e.target.value
      const checked = !!e.target.checked

      if (checked && self.local.selection.indexOf(val) < 0) {
        self.local.selection.push(val)
      } else {
        self.local.selection.splice(self.local.selection.indexOf(val), 1)
      }

      self.emit(self.state.events.PUSHSTATE, '/artists?countries=' + self.local.selection.join(','))
    }

    function handleKeyPress (e) {
      if (e.keyCode === 13) {
        e.preventDefault()
        e.target.control.checked = !e.target.control.checked
        const val = e.target.value
        console.log(val)
      }
    }

    function renderResults (items) {
      return html`
        <ul class="list ma0 pa0 pb3 flex flex-column">
          ${items}
        </ul>
      `
    }
  }

  update (props) {
    return compare(this.local.countries, props.countries)
  }
}

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

    this.local.machine = nanostate.parallel({
      data: nanostate('idle', {
        idle: { 'start': 'loading', 'resolve': 'idle' },
        loading: { 'resolve': 'idle', 'reject': 'error' },
        error: { 'start': 'idle' }
      }),
      loader: nanostate('off', {
        on: { 'toggle': 'off' },
        off: { 'toggle': 'on' }
      }),
      filterDialog: nanostate('close', {
        open: { 'close': 'close' },
        close: { 'open': 'open' }
      })
    })

    this.local.machine.transitions.data.event('data:notFound', nanostate('notFound', {
      notFound: { start: 'idle' }
    }))

    this.local.machine.on('loader:toggle', () => {
      if (this.element) this.rerender()
    })

    this.local.machine.on('data:notFound', () => {
      if (this.element) this.rerender()
    })

    this.local.machine.on('data:error', () => {
      if (this.element) this.rerender()
    })

    this.local.machine.on('filterDialog:open', async () => {
      const machine = this.local.machine

      try {
        const response = await this.state.api.artists.getCountries()
        const items = response.data
        const dialogEl = this.state.cache(Dialog, 'artists-filter-dialog').render({
          title: 'Filter artists by country',
          prefix: 'dialog-default dialog--sm',
          content: new FilterArtists('filter-artists', this.state, this.emit).render({
            countries: items
          }),
          onClose: function (e) {
            machine.emit('filterDialog:close')
            this.destroy()
          }
        })

        document.body.appendChild(dialogEl)
      } catch (err) {
        console.log(err)
      }
    })
  }

  createElement (props = {}) {
    const self = this
    const { items = [], filter: filterEnabled = false, numberOfPages = 1, shuffle = false, pagination: paginationEnabled = true } = props

    this.items = clone(items)

    if (shuffle) {
      this.items = this.items.sort(() => Math.random() - 0.5)
    }

    const artists = {
      loading: {
        'on': this.renderLoader,
        'off': () => void 0
      }[this.local.machine.state.loader](),
      notFound: this.renderPlaceholder(),
      error: this.renderError()
    }[this.local.machine.state.data] || this.renderArtists()

    let paginationEl

    if (paginationEnabled) {
      paginationEl = new Pagination('artists-pagination', this.state, this.emit).render({
        navigate: function (pageNumber) {
          const path = !/artists/.test(this.state.href) ? '/artists' : ''
          const query = this.state.query
          const stringified = '?' + queryString.stringify(Object.assign(query, { page: pageNumber }), { encode: false })
          self.emit(self.state.events.PUSHSTATE, self.state.href + `${path}${stringified}`)
        },
        path: !/artists/.test(this.state.href) ? '/artists' : '',
        numberOfPages
      })
    }

    let filterOptions

    if (filterEnabled) {
      let filterButton = button({
        size: 'none',
        style: 'default',
        onClick: () => this.local.machine.emit('filterDialog:open'),
        text: 'Filter options'
      })
      filterOptions = html`
        <div class="flex justify-end mt3 mr3">
          ${filterButton}
        </div>
      `
    }

    return html`
      <div class="flex flex-column flex-auto w-100">
        ${filterOptions}
        ${artists}
        ${paginationEl}
      </div>
    `
  }

  renderArtists () {
    const items = this.items.map(({ avatar, id, name }) => {
      const artist = new Artist(id, this.state, this.emit)
      return artist.render({ avatar, id, name })
    })
    return html`
      <ul class="artists list ma0 pa0 cf">
        ${items}
      </ul>
    `
  }

  renderError () {
    return html`
      <div class="flex flex-column flex-auto w-100 items-center justify-center">
        <p>Failed to fetch artists</p>
        <div>
          <button onclick=${() => { this.emit('labels:reload', this.state.params.id) }}>Try again</button>
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
      return compare(props.items, this.items)
    }
    return false
  }
}

module.exports = Artists
