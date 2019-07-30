const html = require('choo/html')
const Component = require('choo/component')
const link = require('@resonate/link-element')
const icon = require('@resonate/icon-element')
const { background: bg, iconFill, fg } = require('@resonate/theme-skins')

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
      text: icon('logo', { class: `icon icon--md ${iconFill}` }),
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
            <li>
              <a class="link db dim pa2 w-100" href="/releases">Releases</a>
            </li>
            <li>
              <a class="link db dim pa2 w-100" href="/tracks">Tracks</a>
            </li>
            <li>
              <a class="link db dim pa2 w-100" href="/artworks">Artworks</a>
            </li>
          </ul>
        </nav>
        <nav role="navigation" aria-label="Secondary navigation" class="dropdown-navigation flex flex-auto justify-end items-center">
          <ul class="list ma0 pa0 flex">
          <li>
            <a href="" class="flex justify-end w4 dropdown-toggle">
              <span class="flex justify-center items-center w3 h3">
                ${icon('dropdown', { class: `icon icon--sm ${iconFill}` })}
              </span>
            </a>
            <ul class="${fg} list ma0 pa2 absolute right-0 dropdown z-max" style="left:auto;">
              <li>
                <a class="link db dim pa2 w-100" href="https://${process.env.APP_DOMAIN}/api/connect/resonate">Log out</a>
              </li>
            </ul>
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
