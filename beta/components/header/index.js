const html = require('choo/html')
const Nanocomponent = require('nanocomponent')
const icon = require('@resonate/icon-element')
const nanologger = require('nanologger')
const nanostate = require('nanostate')
const button = require('@resonate/button')
const Dialog = require('@resonate/dialog-component')
const link = require('@resonate/link-element')
const ThemeSwitcher = require('../theme-switcher')
const AddCredits = require('../topup-credits')

const SITE_DOMAIN = process.env.SITE_DOMAIN || 'resonate.localhost'
const BASE_URL = 'https://' + SITE_DOMAIN
const STRIPE_URL = 'https://js.stripe.com/v3/'
const loadScript = require('../../lib/load-script')

const {
  background: bg,
  foreground: fg,
  // text,
  iconFill,
  iconFillInvert,
  bordersInvert: borders
} = require('@resonate/theme-skins')

class Header extends Nanocomponent {
  constructor (name, state, emit) {
    super(name)

    this.emit = emit
    this.state = state

    this.log = nanologger(name)

    this.user = {}

    this.machine = nanostate.parallel({
      creditsDialog: nanostate('close', {
        open: { close: 'close' },
        close: { open: 'open' }
      }),
      logoutDialog: nanostate('close', {
        open: { close: 'close' },
        close: { open: 'open' }
      })
    })

    this.machine.on('creditsDialog:open', async () => {
      if (!this.state.stripe) {
        await loadScript(STRIPE_URL)
        this.state.stripe = Stripe(process.env.STRIPE_TOKEN) /* global Stripe */
      }

      const machine = this.machine
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

    this.machine.on('logoutDialog:open', () => {
      const self = this
      const confirmButton = button({
        type: 'submit',
        value: 'yes',
        size: 'none',
        style: 'default',
        text: 'Confirm'
      })

      const cancelButton = button({
        type: 'submit',
        value: 'no',
        style: 'blank',
        size: 'none',
        text: 'Cancel'
      })

      const dialogEl = this.state.cache(Dialog, 'header-dialog').render({
        title: 'Logout',
        prefix: 'dialog-default dialog--sm',
        content: html`
          <div class="flex flex-column">
            <p class="pr3">Please confirm you want to logout</p>
            <div class="flex">
              ${confirmButton}
              ${cancelButton}
            </div>
          </div>
        `,
        onClose: function (e) {
          if (this.element.returnValue === 'yes') {
            emit('logout', true)
          }
          self.machine.emit('logoutDialog:close')
          this.destroy()
        }
      })

      document.body.appendChild(dialogEl)
    })

    this.machine.on('nav:toggle', () => {
      this.log.info('nav:toggle', this.machine.state.nav)
      this.rerender()
    })

    this.renderRightNav = this.renderRightNav.bind(this)
  }

  createElement (props) {
    this.credits = props.credits
    this.user = props.user || {}
    this.resolved = props.resolved
    this.href = props.href

    /*

    const renderSignup = () => {
      const joinLink = link({
        href: `${BASE_URL}/join`,
        prefix: `${fg} link ph3 pv2 mh2 grow`,
        target: '_blank',
        text: 'Join'
      })

      const hidden = !this.resolved ? 'o-0' : ''

      return html`
        <div class="flex flex-auto items-center justify-end pr3 ${hidden}">
          <p class="ph3 dn db-ns">Don't have an account ?</p>
          ${joinLink}
        </div>
      `
    }

    const renderLogin = () => {
      const hidden = !this.resolved ? 'o-0' : ''
      const loginLink = link({
        href: '/login',
        prefix: `${fg} link ph3 pv2 mh2 grow`,
        text: 'Login'
      })
      const joinLink = link({
        href: `${BASE_URL}/join`,
        prefix: `${text} link ph3 pv2 mh2 grow`,
        target: '_blank',
        text: 'Join'
      })

      return html`
        <div class="flex flex-auto items-center justify-end pr3 ${hidden}">
          <p class="pr3 dn db-ns">Already have an account ?</p>
          ${loginLink}
          ${joinLink}
        </div>
      `
    }

    */

    const prefix = `${bg} sticky h3 left-0 top-0 right-0 w-100 z-9999 flex items-center shadow-contour`

    return html`
      <header role="banner" class=${prefix}>
        ${renderLeftNav()}
        ${this.renderRightNav()}
      </header>
    `
  }

  renderRightNav () {
    const self = this

    return html`
      <nav role="navigation" aria-label="Secondary navigation" class="dropdown-navigation flex flex-auto justify-end items-center">
        <ul class="list ma0 pa0 flex">
          <li>
            <a href="" class="flex justify-end w4 dropdown-toggle">
              <span class="flex justify-center items-center w3 h3">
                ${icon('dropdown', { class: `icon icon--sm ${iconFill}` })}
              </span>
            </a>
            ${dropdownMenu()}
          </li>
        </ul>
      </nav>
    `

    function dropdownMenu () {
      const user = self.user

      if (user.uid) {
        return html`
          <ul class="${fg} list ma0 pa2 absolute right-0 dropdown z-max" style="left:auto;width:100vw;max-width:24rem;">
            <li class="flex items-start">
              <div class="flex flex-column pa2 w-100">
                Credits
                <small class=${self.credits < 0.2 ? 'red' : ''}>${self.credits}</small>
              </div>
              <a href="" onclick=${(e) => { e.preventDefault(); self.machine.emit('creditsDialog:open') }} class="link flex items-center justify-end dim pa2">
                <span class="f7 b ph2">TOP-UP</span>
                <span class="flex justify-center items-center h1 w1">
                  ${icon('add-fat', { class: `icon icon--sm ${iconFillInvert}` })}
                </span>
              </a>
            </li>
            <li>
              ${self.state.cache(ThemeSwitcher, 'theme-switcher-header').render()}
            </li>
            <li>
              <a class="link db dim pa2 w-100" href="/account">Account settings</a>
            </li>
            <li>
              <a href="" onclick=${(e) => self.machine.emit('logoutDialog:open')} class="link db dim pa2 w-100">
                Log out
              </a>
            </li>
          </ul>
        `
      }

      return html`
        <ul class="${dropdownMenuStyle} ${fg} list ma0 pa2 absolute right-0 dropdown z-max" style="left:auto;">
          <li>
            <a class="link db dim pa2 w-100" href="/login">Login</a>
          </li>
          <li class="bb bw ${borders}"></li>
          <li>
            <a class="link db dim pa2 w-100" target="_blank" rel="noopener" href="${BASE_URL}/join">Join</a>
          </li>
        </ul>
      `
    }
  }

  update (props) {
    return this.credits !== props.credits ||
      props.href !== this.href ||
      props.resolved !== this.resolved
  }
}

function renderLeftNav () {
  const brand = link({
    href: '/',
    text: icon('logo', { class: `icon icon--md ${iconFill}` }),
    prefix: 'link flex items-center flex-shrink-0 h-100 grow ph3 overflow-hidden',
    title: 'Resonate Coop'
  })

  const listen = link({
    href: '/',
    text: 'listen',
    prefix: 'link flex items-center h3 ph3'
  })

  const dropdownLink = link({
    href: '',
    text: 'learn',
    prefix: 'link flex items-center h3 ph3 dropdown-toggle'
  })

  return html`
    <nav role="navigation" aria-label="Main navigation" class="flex flex-auto pl2 dropdown-navigation">
      <ul class="list ma0 pa0 flex">
        <li>
          ${brand}
        </li>
        <li>
          ${listen}
        </li>
        <li>
          ${dropdownLink}
          ${renderLearnDropdown()}
        </li>
      </ul>
    </nav>
  `

  function renderLearnDropdown () {
    const links = [
      ['/about', 'About'],
      ['/stream2own', 'Pricing'],
      ['/the-coop', 'Co-op'],
      ['/blog', 'Blog']
    ].map(([path, text]) => [BASE_URL + path, text])

    const item = ([href, text]) => {
      const linkEl = link({
        href,
        text,
        classList: 'link db dim pv2 ph2 w-100',
        target: '_blank'
      })
      return html`<li>${linkEl}</li>`
    }

    return html`
      <ul class="list ${fg} e ma0 pa0 absolute dropdown">
        ${links.map(item)}
      </ul>
    `
  }
}

module.exports = Header
