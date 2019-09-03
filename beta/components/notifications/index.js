const Component = require('choo/component')
const compare = require('nanocomponent/compare')
const html = require('choo/html')
const css = require('sheetify')
const morph = require('nanomorph')
const clone = require('shallow-clone')
const iconElement = require('@resonate/icon-element')
const { foreground: fg, iconFillInvert, bordersInvert: borders } = require('@resonate/theme-skins')

const prefix = css`
  :host {
    top: calc(var(--height-3) + 1rem);
    transform: translateX(-50%);
    left: 50%;
  }
  :host li.message {
    &.error .icon {
      fill: var(--red);
    }
    &.success .icon {
      fill: var(--green);
    }
  }
`

class Notifications extends Component {
  constructor (name) {
    super(name)

    this._removeNotification = this._removeNotification.bind(this)
    this.renderNotifications = this.renderNotifications.bind(this)

    this.notifications = []
  }

  createElement (notifications = []) {
    this.notifications = clone(notifications)

    return html`
      <div class="${prefix} fixed w-100 w-50-l flex flex-auto z-max">
        ${this.renderNotifications()}
      </div>
    `
  }

  renderNotifications () {
    const notifications = this.notifications.map(({ type = 'info', message }) => {
      const iconName = {
        error: 'info',
        info: 'info',
        success: 'check'
      }[type]

      return html`
        <li class="${fg} ${borders} ba bw1 flex flex-auto items-center tc pv1 mb2 message ${type}">
          <span class="flex items-center justify-center h3 w3">
            ${iconElement(iconName, { class: `icon icon--sm ${iconFillInvert}` })}
          </span>
          <p class="lh-copy pl2 f5">
            ${message}
          </p>
        </li>
      `
    })

    return html`
      <ul class="list flex flex-auto flex-column ma0 pa0">
        ${notifications}
      </ul>
      `
  }

  add (notification) {
    const { timeout = 3000, message = 'Hello World' } = notification

    this.notifications.push(notification)

    morph(this.element.querySelector('.list'), this.renderNotifications())

    setTimeout(
      this._removeNotification,
      timeout,
      message
    )
  }

  info (text) {
    this.add({ type: 'info', message: text })
  }

  error (text) {
    this.add({ type: 'error', message: text })
  }

  warning (text) {
    this.add({ type: 'warning', message: text })
  }

  success (text) {
    this.add({ type: 'success', message: text })
  }

  _removeNotification () {
    this.notifications.splice(0, 1)

    if (!this.element) return

    morph(this.element.querySelector('.list'), this.renderNotifications())

    if (!this.notifications.length) {
      const dialog = document.querySelector('dialog')
      const host = dialog || document.body
      if (host) host.removeChild(this.element)
    }
  }

  update (notifications) {
    return compare(notifications, this.notifications)
  }
}

module.exports = Notifications
