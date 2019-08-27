const Component = require('choo/component')
const html = require('choo/html')
const icon = require('@resonate/icon-element')

const {
  background: bg,
  text,
  iconFill
} = require('@resonate/theme-skins')

class Header extends Component {
  constructor (id, state, emit) {
    super(id)
    this.local = state.components[id] = {}
    this.state = state
    this.emit = emit
  }

  createElement (props) {
    this._href = props.href

    return html`
      <header class="${bg} ${text} shadow-contour sticky h3 top-0 left-0 right-0 w-100 z-max flex items-center">
        <a href="https://beta.resonate.is" class="link h3 w3 flex items-center justify-center">
          ${icon('logo', { class: `icon icon--md ${iconFill}` })}
        </a>
      </header>
    `
  }

  update (props) {
    return this._href !== props.href
  }
}

module.exports = Header
