const Nanocomponent = require('choo/component')
const html = require('choo/html')
const equals = require('is-equal-shallow')
const borderColors = 'b--near-black'

const css = require('sheetify')
const prefix = css`
  :host > ul {
    height: calc(100vh - (var(--height-3) + 48px));
    max-width: 300px;
  }
  :host > ul > li > a {
    padding: .85rem .75rem .75rem .55rem;
  }
`

class Explore extends Nanocomponent {
  constructor (name, state, emit) {
    super(name)

    this.state = state
    this.emit = emit
  }

  createElement (props) {
    this.user = props.user

    const USER_SCOPE = this.user.username ? `/${this.user.username}` : ''

    return html`
      <nav role="navigation" aria-label="App navigation" class="${prefix} bg-black white sticky z-4 br bw ${borderColors}" style="min-width:300px;top: calc(var(--height-3) * 2)">
        <ul class="list overflow-auto ma0 pa0 pb6">
          <li class="lh-copy bb bw ${borderColors}">
            <a href="/artists" class="flex items-center link dim ph2 dropdown-toggle">
              Browse
            </a>
            <ul class="list ma0 pa0 dropdown">
              <li>
                <a class="link db dim pv2 pl4 w-100" href="/artists">Artists</a>
              </li>
              <li>
                <a class="link db dim pv2 pl4 w-100" href="/labels">Labels</a>
              </li>
              <li>
                <a class="link db dim pv2 pl4 w-100" href="/playlist/latest">New</a>
              </li>
            </ul>
          </li>
          <li class="lh-copy bb bw ${borderColors}">
            <a href="${USER_SCOPE}/library/favorites" class="flex items-center link dim ph2 dropdown-toggle">
              Library
            </a>
            <ul class="list ma0 pa0 dropdown">
              <li>
                <a class="link db dim pv2 pl4 w-100" href="${USER_SCOPE}/library/favorites">Favorites</a>
              </li>
              <li>
                <a class="link db dim pv2 pl4 w-100" href="${USER_SCOPE}/library/owned">Owned</a>
              </li>
              <li>
                <a class="link db dim pv2 pl4 w-100" href="${USER_SCOPE}/library/history">History</a>
              </li>
            </ul>
          </li>
          <li class="lh-copy bb bw ${borderColors}">
            <a href="/playlist/top-fav" class="flex items-center link dim ph2">
              Top Favorites
            </a>
          </li>
          <li class="lh-copy bb bw ${borderColors}">
            <a href="/playlist/staff-picks" class="flex items-center link dim ph2">
              Staff Picks
            </a>
          </li>
          <li class="lh-copy bb bw ${borderColors}">
            <a href="https://resonate.is/music/support/" class="flex items-center link dim ph2" target="_blank" rel="noopener noreferer">
              Support
            </a>
          </li>
        </ul>
      </nav>
    `
  }

  update (props) {
    return !equals(props.user, this.user)
  }
}

module.exports = Explore
