const html = require('choo/html')
const Component = require('choo/component')
const link = require('@resonate/link-element')
const icon = require('@resonate/icon-element')
const { background: bg, iconFill } = require('@resonate/theme-skins')

class Header extends Component {
  constructor (id, state, emit) {
    super(id)

    this.emit = emit
    this.state = state
    this.local = state.components[id] = {}
  }

  createElement (props) {
    this.local.href = props.href

    const brand = link({
      href: '/',
      text: icon('logo', { 'class': `icon icon--md ${iconFill}` }),
      prefix: 'link flex items-center flex-shrink-0 h-100 grow ph3 overflow-hidden',
      title: 'Resonate Coop'
    })

    const prefix = `${bg} sticky h3 left-0 top-0 right-0 w-100 z-9999 flex items-center shadow-contour`

    return html`
      <header role="banner" class=${prefix}>
        <nav role="navigation" aria-label="Main navigation" class="flex flex-auto pl2 dropdown-navigation">
          <ul class="list ma0 pa0 flex">
            <li>
              ${brand}
            </li>
          </ul>
        </nav>
      </header>
    `
  }

  update (props) {
    return props.href !== this.local.href
  }
}

module.exports = Header
