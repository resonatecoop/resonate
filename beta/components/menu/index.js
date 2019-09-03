const html = require('choo/html')
const css = require('sheetify')
const Component = require('choo/component')
const nanostate = require('nanostate')
const icon = require('@resonate/icon-element')
const Search = require('../search')
const matchMedia = require('../../lib/match-media')
const Nanobounce = require('nanobounce')
const nanobounce = Nanobounce()
const ResizeObserver = require('resize-observer-polyfill')
const button = require('@resonate/button')
const { background, borders: borderColors, iconFill } = require('@resonate/theme-skins')
const noop = () => {}

const prefix = css`
  :host .search {
    max-width: 480px;
    margin: 0 auto;
  }
`

const subMenuItems = [
  {
    type: 'top-fav',
    name: 'top favorites'
  },
  {
    type: 'staff-picks',
    name: 'staff picks'
  }
]

class Menu extends Component {
  constructor (name, state, emit) {
    super(name)
    this.state = state
    this.emit = emit

    this.machine = nanostate.parallel({
      search: nanostate('off', {
        on: { toggle: 'off' },
        off: { toggle: 'on' }
      }),
      library: nanostate('off', {
        on: { toggle: 'off' },
        off: { toggle: 'on' }
      }),
      browse: nanostate('off', {
        on: { toggle: 'off' },
        off: { toggle: 'on' }
      })
    })

    this.renderMenu = this.renderMenu.bind(this)
    this.renderSearch = this.renderSearch.bind(this)
    this.renderSubNavigation = this.renderSubNavigation.bind(this)
    this.renderBrowseItems = this.renderBrowseItems.bind(this)
    this.renderLibraryItems = this.renderLibraryItems.bind(this)

    this.machine.on('browse:toggle', () => {
      if (this.element) this.rerender()
    })

    this.machine.on('library:toggle', () => {
      if (this.element) this.rerender()
    })

    this.machine.on('search:toggle', () => {
      if (this.element) this.rerender()
    })

    this.items = []
  }

  createElement (props = {}) {
    this.user = this.state.user
    this.title = props.title

    const main = {
      on: () => this.renderSearch(),
      off: () => this.renderMenu()
    }[this.machine.state.search]()

    return html`
      <div class="${prefix} ${background} bb bw ${borderColors} flex justify-center flex-column z-3" style="min-height:var(--height-3);">
        ${main}
      </div>
    `
  }

  renderSearch () {
    const search = this.state.cache(Search, 'search').render({
      placeholder: 'Search for tracks, artists, labels'
    })
    const closeButton = button({
      onClick: (e) => this.machine.emit('search:toggle'),
      style: 'blank',
      iconName: 'close',
      iconSize: 'xs'
    })

    return html`
      <div class="search flex items-center w-100">
        ${search}
        ${closeButton}
      </div>
      `
  }

  renderLibraryItems () {
    const closeButton = button({
      onClick: (e) => this.machine.emit('library:toggle'),
      title: 'Close library',
      style: 'blank',
      iconName: 'close',
      iconSize: 'xs'
    })

    const USER_SCOPE = this.user.username ? `/${this.user.username}` : ''

    return html`
      <div class="flex flex-auto items-center w-100 relative">
        <nav class="flex flex-auto w-100">
          <ul class="menu main-menu flex w-100 list ma0 pa0">
            <li class="flex flex-auto mw4 justify-center items-center ${this.state.href === '/playlist/favorites' ? 'active' : ''}">
              <a href="${USER_SCOPE}/library/favorites" class="flex items-center justify-center no-underline bb bw1 color-inherit w-100 h-100 b--transparent bg-transparent pa0 ma0">
                favorites
              </a>
            </li>
            <li class="flex flex-auto mw4 justify-center items-center">
              <a href="${USER_SCOPE}/library/owned" class="flex items-center justify-center no-underline bb bw1 color-inherit w-100 h-100 b--transparent bg-transparent pa0 ma0">owned</a>
            </li>
            <li class="flex flex-auto mw4 justify-center items-center">
              <a href="${USER_SCOPE}/library/history" class="flex items-center justify-center no-underline bb bw1 color-inherit w-100 h-100 b--transparent bg-transparent pa0 ma0">history</a>
            </li>
          </ul>
        </nav>
        ${closeButton}
      </div>
    `
  }

  renderBrowseItems () {
    const closeButton = button({
      onClick: (e) => this.machine.emit('browse:toggle'),
      title: 'Close library',
      style: 'blank',
      iconName: 'close',
      iconSize: 'xs'
    })
    return html`
      <div class="flex flex-auto items-center w-100 relative">
        <nav class="flex flex-auto w-100">
          <ul class="menu main-menu flex w-100 list ma0 pa0">
            <li class="flex flex-auto mw4 justify-center items-center ${this.state.href === '/artists' ? 'active' : ''}">
              <a href="/artists" class="relative flex items-center no-underline justify-center bb bw1 color-inherit w-100 h-100 b--transparent bg-transparent pa0 ma0">artists</a>
            </li>
            <li class="flex flex-auto mw4 justify-center items-center ${this.state.href === '/labels' ? 'active' : ''}">
              <a href="/labels" class="relative flex items-center no-underline justify-center bb bw1 color-inherit w-100 h-100 b--transparent bg-transparent pa0 ma0">labels</a>
            </li>
            <li class="flex flex-auto mw4 justify-center items-center ${this.state.href === '/playlist/latest' ? 'active' : ''}">
              <a href="/playlist/latest" class="relative flex items-center no-underline justify-center bb bw1 color-inherit w-100 h-100 b--transparent bg-transparent pa0 ma0">new</a>
            </li>
          </ul>
        </nav>
        ${closeButton}
      </div>
    `
  }

  renderMenu () {
    const subNavigation = {
      on: this.renderLibraryItems,
      off: noop
    }[this.machine.state.library]() || {
      on: this.renderBrowseItems,
      off: noop
    }[this.machine.state.browse]() || this.renderSubNavigation()

    return html`
      <div class="flex flex-column w-100">
        <div class="flex items-center relative">
          <div class="flex w-100 flex-auto justify-center-l">
            <h2 class="lh-title f6 normal f4-l mt0 mb0 pl3 ttc truncate">
              ${this.state.shortTitle}
            </h2>
          </div>
          <nav class="flex w-100 w-25-l absolute-l right-0">
            <ul class="menu main-menu flex w-100 list ma0 pa0 justify-end-l">
              <li class="flex flex-auto mw4 justify-center items-center ${this.state.href === '/playlist/random' ? 'active' : ''}">
                <a href="/playlist/random" class="relative flex items-center justify-center bb bw1 color-inherit w-100 h-100 b--transparent bg-transparent pa0 ma0">
                  <div class="flex justify-center">
                    ${icon('random', { class: `icon icon--sm ${iconFill}` })}
                    <span class="label f6 tc">random</span>
                  </div>
                </a>
              </li>
              <li class="flex flex-auto mw4 justify-center items-center ${this.machine.state.search === 'on' ? 'active' : ''}">">
                <button onclick=${(e) => this.machine.emit('search:toggle')} class="relative color-inherit bn br0 w-100 h-100 b--transparent bg-transparent pa0 ma0">
                  <div class="flex justify-center">
                    ${icon('search', { class: `icon icon--sm ${iconFill}` })}
                    <span class="label f6">search</span>
                  </div>
                </button>
              </li>
            </ul>
          </nav>
        </div>
        ${!matchMedia('lg') ? subNavigation : ''}
      </div>
    `
  }

  renderSubNavigation () {
    return html`
      <nav class="flex w-100">
        <ul class="menu flex w-100 list ma0 pa0">
          <li class="flex flex-auto mw4 justify-center items-center">
            <button class="bg-transparent bn br0 color-inherit" onclick=${(e) => this.machine.emit('browse:toggle')}>
              browse
            </button>
          </li>
          <li class="flex flex-auto mw4 justify-center items-center">
            <button class="bg-transparent bn br0 color-inherit" onclick=${(e) => this.machine.emit('library:toggle')}>
              library
            </button>
          </li>
          ${subMenuItems.map(({ type, name }) => html`
            <li class="flex flex-auto mw4 justify-center items-center ${this.state.href === `/playlist/${type}` ? 'active' : ''}">
              <a href="/playlist/${type}" class="relative flex items-center justify-center bb bw1 color-inherit w-100 h-100 b--transparent bg-transparent pa0 ma0 no-underline">
                <div class="flex justify-center items-center">
                  <span class="ph2">${name}</span>
                </div>
              </a>
            </li>
          `)}
        </ul>
      </nav>
    `
  }

  load () {
    this.ro = new ResizeObserver((entries, observer) => {
      nanobounce(() => {
        if (this.element) this.rerender()
      })
    })

    this.ro.observe(document.body)
  }

  unload () {
    this.ro.unobserve(document.body)
  }

  update (props) {
    return props.title !== this.title
  }
}

module.exports = Menu
