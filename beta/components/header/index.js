const html = require('choo/html')
const Nanocomponent = require('choo/component')
const icon = require('@resonate/icon-element')
const nanostate = require('nanostate')
const button = require('@resonate/button')
const Dialog = require('@resonate/dialog-component')
const link = require('@resonate/link-element')
const ThemeSwitcher = require('../theme-switcher')
const AddCredits = require('../topup-credits')
const cookies = require('browser-cookies')

const logger = require('nanologger')
const log = logger('header')

const SITE_DOMAIN = process.env.SITE_DOMAIN || 'resonate.localhost'
const BASE_URL = 'https://' + SITE_DOMAIN
const STRIPE_URL = 'https://js.stripe.com/v3/'
const loadScript = require('../../lib/load-script')

const {
  background: bg,
  foreground: fg,
  iconFill,
  iconFillInvert,
  bordersInvert: borders
} = require('@resonate/theme-skins')

class Header extends Nanocomponent {
  constructor (id, state, emit) {
    super(id)

    this.local = state.components[id] = {}

    this.emit = emit
    this.state = state

    this.local.user = {}

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
      const status = cookies.get('cookieconsent_status')

      if (status !== 'allow') {
        this.machine.emit('creditsDialog:close')

        return emit('cookies:openDialog')
      }

      if (!this.state.stripe) {
        try {
          await loadScript(STRIPE_URL)

          this.state.stripe = Stripe(process.env.STRIPE_TOKEN) /* global Stripe */
        } catch (err) {
          log.error(err)
        }
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

      const machine = this.machine

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
          machine.emit('logoutDialog:close')
          this.destroy()
        }
      })

      document.body.appendChild(dialogEl)
    })

    this.machine.on('nav:toggle', () => {
      this.rerender()
    })
  }

  createElement (props) {
    const state = this.state
    const machine = this.machine
    const local = this.local

    this.local.credits = props.credits
    this.local.user = props.user || {}
    this.local.resolved = props.resolved
    this.local.href = props.href

    const prefix = `${bg} sticky h3 left-0 top-0 right-0 w-100 z-9999 flex items-center shadow-contour`

    const brand = link({
      href: '/',
      text: icon('logo', { size: 'md', class: iconFill }),
      prefix: 'link flex items-center flex-shrink-0 h-100 grow ph3 overflow-hidden',
      title: 'Stream2own'
    })

    return html`
      <header role="banner" class=${prefix}>
        <h1 class="ml2">
          ${brand}
        </h1>
        ${renderLeftNav()}
        ${renderRightNav(state, machine, local)}
      </header>
    `
  }

  update (props) {
    if (props.resolved && this.machine.state.creditsDialog !== 'open') {
      if (this.state.query.payment_intent) {
        this.machine.emit('creditsDialog:open')
      }
    }
    return props.credits !== this.local.credits ||
      props.href !== this.local.href ||
      props.resolved !== this.local.resolved
  }
}

function renderRightNav (state, machine, local) {
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
    if (local.user.uid) {
      return html`
        <ul class="${fg} list ma0 pa2 absolute right-0 dropdown z-999" style="width: 100vw;left:auto;margin-top:1px;max-width:24rem;">
          <li class="flex items-start">
            <div class="flex flex-column pa2 w-100">
              Credits
              <small class=${local.credits < 0.2 ? 'red' : ''}>${local.credits}</small>
            </div>
            <a href="" onclick=${(e) => { e.preventDefault(); machine.emit('creditsDialog:open') }} class="link flex items-center justify-end dim pa2">
              <span class="f7 b ph2">TOP-UP</span>
              <span class="flex justify-center items-center h1 w1">
                ${icon('add-fat', { class: `icon icon--sm ${iconFillInvert}` })}
              </span>
            </a>
          </li>
          <li>
            ${state.cache(ThemeSwitcher, 'theme-switcher-header').render()}
          </li>
          <li>
            <a class="link db dim pa2 w-100" href="/account">Account settings</a>
          </li>
          <li>
            <a href="" onclick=${(e) => machine.emit('logoutDialog:open')} class="link db dim pa2 w-100">
              Log out
            </a>
          </li>
        </ul>
      `
    }

    return html`
      <ul class="${fg} list ma0 pa2 absolute right-0 dropdown z-999" style="width: 100vw;left:auto;margin-top:1px;max-width:24rem;">
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

function renderLeftNav () {
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
    <nav role="navigation" aria-label="Main navigation" class="dropdown-navigation flex flex-auto">
      <ul class="list ma0 pa0 flex">
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
