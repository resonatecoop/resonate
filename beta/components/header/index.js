const html = require('choo/html')
const Component = require('choo/component')
const icon = require('@resonate/icon-element')
const nanostate = require('nanostate')
const button = require('@resonate/button')
const Dialog = require('@resonate/dialog-component')
const Search = require('../search')
const link = require('@resonate/link-element')
const ThemeSwitcher = require('../theme-switcher')
const AddCredits = require('../topup-credits')
const cookies = require('browser-cookies')
const morph = require('nanomorph')
const imagePlaceholder = require('@resonate/svg-image-placeholder')

const logger = require('nanologger')
const log = logger('header')

const { loadStripe } = require('@stripe/stripe-js')

const { foreground: fg } = require('@resonate/theme-skins')

class Header extends Component {
  constructor (id, state, emit) {
    super(id)

    this.local = state.components[id] = {}

    this.emit = emit
    this.state = state

    this.local.user = {}

    this.local.credits = 0

    this.local.machine = nanostate.parallel({
      creditsDialog: nanostate('close', {
        open: { close: 'close' },
        close: { open: 'open' }
      }),
      library: nanostate('off', {
        on: { toggle: 'off' },
        off: { toggle: 'on' }
      }),
      browse: nanostate('off', {
        on: { toggle: 'off' },
        off: { toggle: 'on' }
      }),
      search: nanostate('off', {
        on: { toggle: 'off' },
        off: { toggle: 'on' }
      }),
      logoutDialog: nanostate('close', {
        open: { close: 'close' },
        close: { open: 'open' }
      })
    })

    this.local.machine.on('search:toggle', () => {
      morph(this.element.querySelector('.search'), this.renderSearch())
      if (this.local.machine.state.search === 'on') {
        const input = document.querySelector('input[type="search"]')
        if (input && input !== document.activeElement) input.focus()
      }
    })

    this.local.machine.on('creditsDialog:open', async () => {
      const status = cookies.get('cookieconsent_status')

      if (status !== 'allow') {
        this.local.machine.emit('creditsDialog:close')

        return emit('cookies:openDialog')
      }

      if (!this.state.stripe) {
        try {
          this.state.stripe = await loadStripe(process.env.STRIPE_TOKEN)
        } catch (err) {
          log.error(err)
        }
      }

      const machine = this.local.machine
      const dialogEl = this.state.cache(Dialog, 'header-dialog').render({
        title: 'Top up your Resonate account',
        prefix: 'dialog-default dialog--sm',
        content: new AddCredits('credits-topup', state, emit).render(),
        onClose: function (e) {
          machine.emit('creditsDialog:close')
          this.destroy()
        }
      })

      document.body.appendChild(dialogEl)
    })

    this.local.machine.on('logoutDialog:open', () => {
      const confirmButton = button({
        type: 'submit',
        value: 'yes',
        outline: true,
        theme: 'light',
        text: 'Log out'
      })

      const cancelButton = button({
        type: 'submit',
        value: 'no',
        outline: true,
        theme: 'light',
        text: 'Cancel'
      })

      const machine = this.local.machine

      const dialogEl = this.state.cache(Dialog, 'header-dialog').render({
        title: 'Log out',
        prefix: 'dialog-default dialog--sm',
        content: html`
          <div class="flex flex-column">
            <p class="lh-copy f5">Confirm you want to log out.</p>
            <div class="flex items-center">
              <div class="mr3">
                ${confirmButton}
              </div>
              <div>
                ${cancelButton}
              </div>
            </div>
          </div>
        `,
        onClose: function (e) {
          if (this.element.returnValue === 'yes') {
            emit('logout', false)
            window.location = '/api/v2/user/logout'
          }
          machine.emit('logoutDialog:close')
          this.destroy()
        }
      })

      document.body.appendChild(dialogEl)
    })

    this.local.machine.on('nav:toggle', () => {
      if (this.element) this.rerender()
    })

    this.local.machine.on('browse:toggle', () => {
      if (this.element) this.rerender()
    })

    this.local.machine.on('library:toggle', () => {
      if (this.element) this.rerender()
    })

    this.renderSearch = this.renderSearch.bind(this)
  }

  createElement (props) {
    this.local.credits = props.credits
    this.local.user = props.user || {}
    this.local.resolved = props.resolved
    this.local.href = props.href

    const nav = () => {
      const avatar = this.state.user.avatar || {}
      const fallback = avatar.small || imagePlaceholder(60, 60) // v1 or undefined
      const src = avatar['profile_photo-sm'] || fallback // v2

      return html`
        <nav role="navigation" aria-label="Main navigation" class="dropdown-navigation flex w-100 flex-auto justify-end-l">
          <ul class="flex list ma0 pa0 w-100 justify-around items-center mr3-l" role="menu">
            <li class="flex flex-auto w-100 justify-center relative${/artists|labels/.test(this.state.href) ? ' active' : ''}" role="menuitem">
              <a href="/artists" class="dn db-l link b gray pv2 ph3">Browse</a>
              <button class="db dn-l bg-transparent bn b gray pa0" title="Open Browse Menu" onclick=${(e) => this.local.machine.emit('browse:toggle')} >
                <span class="flex justify-center items-center">
                  Browse
                </span>
              </button>
            </li>
            <li class="flex flex-auto w-100 justify-center relative${this.state.href === '/discovery' ? ' active' : ''}" role="menuitem">
              <a href="/discovery" class="link db b gray pv2 ph3">Discovery</a>
            </li>
            <li class="flex w-100 justify-center clip-l" role="menuitem">
              <button onclick=${() => this.local.machine.emit('search:toggle')} class="dn-l bn bg-transparent pa0">
                ${icon('search', { size: 'sm', class: 'fill-white' })}
              </button>
            </li>
            ${this.state.user.uid
              ? html`
                <li class="flex flex-auto w-100 justify-center relative${this.state.href.includes('library') ? ' active' : ''}" role="menuitem">
                  <a href="/u/${this.state.user.uid}-${this.state.user.nicename}/library/favorites" class="link dn db-l b gray pv2 ph3">Library</a>
                  <button class="db dn-l bg-transparent bn b gray pa0" title="Open Library Menu" onclick=${(e) => this.local.machine.emit('library:toggle')} >
                    <span class="flex justify-center items-center">
                      Library
                    </span>
                  </button>
                </li>
              `
              : html`<li class="flex flex-auto w-100 justify-center" role="divider"></li>`}
            <li class="flex flex-auto justify-center w-100" role="menuitem">
              <button title="Open menu" class="bg-transparent bn dropdown-toggle w-100 pa0">
                <span class="flex justify-center items-center">
                  <div class="fl w-100 mw2">
                    <div class="db aspect-ratio aspect-ratio--1x1 bg-dark-gray bg-dark-gray--dark">
                      <figure class="ma0">
                        <img src=${src} width=60 height=60 class="aspect-ratio--object z-1" />
                        <figcaption class="clip">${this.state.user.login}</figcaption>
                      </figure>
                    </div>
                  </div>
                  <div class="ph2">
                    ${icon('dropdown', { size: 'sm', class: 'fill-gray' })}
                  </div>
                </span>
              </button>
              <ul class="${fg} ba bw b--near-black list ma0 pa3 absolute right-0 dropdown z-999" style="width:100vw;left:auto;margin-top:1px;max-width:24rem;" role="menu">
                <li class="${!this.state.user.uid ? 'dn' : 'flex'} items-start" role="menuitem" onclick=${(e) => { e.stopPropagation(); this.local.machine.emit('creditsDialog:open') }}>
                  <div class="flex flex-column">
                    <label for="credits">Total credits:</label>
                    <input disabled tabindex="-1" name="credits" type="number" value=${this.local.credits} readonly class="bn br0 bg-transparent b ${this.local.credits < 0.128 ? 'red' : ''}">
                  </Div>
                  ${button({
                    onClick: (e) => { e.stopPropagation(); this.local.machine.emit('creditsDialog:open') },
                    style: 'blank',
                    text: 'Add credits',
                    iconName: 'add-fat',
                    outline: true
                  })}
                </li>
                <li class="mb1" role="menuitem">
                  ${this.state.cache(ThemeSwitcher, 'theme-switcher-header').render()}
                </li>
                <li class=${!this.state.resolved || !this.state.user.id ? 'dn' : 'mb1'} role="menuitem">
                  <a class="link db pv2" href="/u/${this.state.user.id}">Profile</a>
                </li>
                <li class=${!this.state.resolved || !this.state.user.id ? 'dn' : 'mb1'} role="menuitem">
                  <a class="link db pv2" href="/api/v2/user/profileRedirect" onclick=${(e) => { e.preventDefault(); window.location = '/api/v2/user/profileRedirect' }}>Edit profile</a>
                </li>
                <li class=${!this.state.resolved || this.state.user.id ? 'dn' : 'mb1'} role="menuitem">
                  <a class="link db pv2" href="/api/v2/user/connect/resonate" onclick=${(e) => { e.preventDefault(); window.location = '/api/v2/user/connect/resonate' }}>Login</a>
                </li>
                <li class=${!this.state.resolved || this.state.user.id ? 'dn' : 'mb1'} role="menuitem">
                  <a class="link db pv2" target="_blank" rel="noreferer noopener" href="https://resonate.is/join">Become a member</a>
                </li>
                <li class="mb1" role="menuitem">
                  <a class="link db pv2" href="/faq">FAQ</a>
                </li>
                <li class="mb1" role="menuitem">
                  <a class="link db pv2" target="blank" rel="noreferer noopener" href="https://resonate.is/support">Support</a>
                </li>
                <li class="mb1" role="menuitem">
                  <a class="link db pv2" href="/settings">Settings</a>
                </li>
                <li class="bb bw b--near-black b--near-black--light b--gray--dark mb3" role="separator"></li>
                <li class=${!this.state.user.uid ? 'dn' : ''} role="menuitem">
                  <div class="flex justify-end">
                    ${button({
                      onClick: (e) => this.local.machine.emit('logoutDialog:open'),
                      style: 'blank',
                      text: 'Log out',
                      outline: true
                    })}
                  </div>
                </li>
              </ul>
            </li>
          </ul>
        </nav>
      `
    }

    const renderDefault = () => {
      return html`
        ${this.renderSearch()}
        ${nav()}
      `
    }

    const subMenu = {
      on: this.renderSubMenuItems({ name: 'library', eventName: 'library:toggle' }, this.local.machine)
    }[this.local.machine.state.library] || {
      on: this.renderSubMenuItems({ name: 'browse', eventName: 'browse:toggle' }, this.local.machine)
    }[this.local.machine.state.browse] || renderDefault

    return html`
      <header role="banner" class="bg-black shadow-contour white fixed sticky-l left-0 top-0-l bottom-0 right-0 w-100 z-9999 flex items-center" style="height:3rem">
        <div class="dn relative-l flex-l flex-auto-l w-100-l">
          ${link({
            href: '/',
            text: icon('logo', { class: 'fill-white' }),
            onClick: e => {
              e.preventDefault()

              this.emit(this.state.events.PUSHSTATE, this.state.user.uid ? '/discovery' : '/')
            },
            prefix: 'link flex items-center flex-shrink-0 h-100 ph2 ml2',
            title: 'Resonate'
          })}
        </div>
        ${subMenu()}
      </header>
    `
  }

  renderSubMenuItems ({ name = 'library', eventName }, machine) {
    return () => {
      const baseHref = `/u/${this.state.user.uid}-${this.state.user.nicename}/library`
      const items = {
        library: [
          {
            href: baseHref + '/favorites',
            text: 'Favorites'
          },
          {
            href: baseHref + '/collection',
            text: 'Collection'
          },
          {
            href: baseHref + '/playlists',
            text: 'Playlists'
          },
          {
            href: baseHref + '/history',
            text: 'History'
          }
        ],
        browse: [
          {
            text: 'Artists',
            href: '/artists'
          },
          {
            text: 'Labels',
            href: '/labels'
          },
          {
            text: 'Releases',
            href: '/releases'
          },
          {
            text: 'Tracks',
            href: '/tracks'
          }
        ]
      }[name]

      const closeButton = button({
        prefix: 'w3 h-100',
        onClick: () => machine.emit(eventName),
        title: 'Close menu',
        justifyCenter: true,
        style: 'blank',
        size: 'md',
        iconName: 'close',
        iconSize: 'xs'
      })

      return html`
        <div class="flex flex-auto items-center w-100 relative">
          <nav class="flex flex-auto w-100">
            <ul class="menu flex w-100 list ma0 pa0">
              ${items.map(({ text, href }) => {
                const active = this.state.href === href

                return html`
                  <li class="flex flex-auto justify-center relative ${active ? 'active' : ''}">
                    <a href=${href} class="link db b gray pv2 ph3">${text}</a>
                  </li>
                `
              })}
            </ul>
          </nav>
          ${closeButton}
        </div>
      `
    }
  }

  renderSearch () {
    const search = {
      on: () => this.state.cache(Search, 'search').render(),
      off: () => {
        const attrs = {
          onclick: (e) => {
            this.local.machine.emit('search:toggle')
          },
          class: 'js bn dn db-l bg-transparent'
        }
        return html`
          <button ${attrs}>
            <div class="flex items-center">
              ${icon('search', { size: 'sm', class: 'fill-gray' })}
              <span class="db pl3 b gray">Search</span>
            </div>
          </button>
        `
      }
    }[this.local.machine.state.search]

    return html`
      <div class="search flex-l flex-auto-l w-100-l justify-center-l">
        ${search()}
        <noscript>${this.state.cache(Search, 'search-noscript').render()}</noscript>
      </div>
    `
  }

  update (props) {
    if (props.resolved && this.local.machine.state.creditsDialog !== 'open') {
      if (this.state.query.payment_intent) {
        this.local.machine.emit('creditsDialog:open')
      }
    }
    return props.credits !== this.local.credits ||
      props.href !== this.local.href ||
      props.resolved !== this.local.resolved
  }
}

module.exports = Header
