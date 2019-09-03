const Component = require('choo/component')
const html = require('choo/html')
const css = require('sheetify')
const icon = require('@resonate/icon-element')
const inputEl = require('@resonate/input-element')
const { iconFillInvert } = require('@resonate/theme-skins')
const Nanobounce = require('nanobounce')
const nanobounce = Nanobounce()

const prefix = css`
  :host .search-label {
    top: 50%;
    transform: translateY(-50%) scaleX(-1);
  }
  :host input[type="search"] {
    appearance: none;
    text-indent: 1.5rem;
    font-family: inherit;
  }
  :host input[type="search"]::-webkit-search-cancel-button {
    appearance: none;
  }
`

class Search extends Component {
  constructor (name, state, emit) {
    super(name)

    this.emit = emit
    this.state = state

    this.placeholder = ''
    this.inputValue = ''

    this.submit = this.submit.bind(this)
  }

  createElement (props) {
    this.placeholder = props.placeholder

    const searchInput = inputEl({
      autofocus: true,
      type: 'search',
      onKeyPress: e => nanobounce(() => (this.inputValue = e.target.value) && this.rerender()),
      value: this.inputValue,
      name: 'search',
      id: 'searchbox',
      required: true,
      placeholder: this.placeholder
    })

    return html`
      <div class="${prefix} w-100 pl1 pl0-ns">
        <form id="searchForm" name="searchForm" class="flex relative ma0" onsubmit=${this.submit}>
          <label class="search-label flex absolute left-1 z-1" for="search">
            ${icon('search', { class: `icon icon--sm ${iconFillInvert}` })}
          </label>
          ${searchInput}
        </form>
      </div>
    `
  }

  submit (e) {
    e.preventDefault()

    const val = e.target.search.value

    if (!val) return false
    if (val.length < 3) return false

    this.inputValue = e.target.search.value

    this.emit('search', this.inputValue)
  }

  load () {
    const input = this.element.querySelector('input[type="search"]')
    if (input !== document.activeElement) input.focus()
  }

  update () {
    return false
  }
}

module.exports = Search
