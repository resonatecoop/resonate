const html = require('choo/html')
const Nanocomponent = require('choo/component')
const animation = require('nanoanimation')
const dialogPonyfill = () => require('dialog-polyfill')
const button = require('@resonate/button')

/**
 * Component wrapper for <dialog> element
 */

class CookieConsent extends Nanocomponent {
  constructor (name, state, emit) {
    super(name)

    this.state = state
    this.emit = emit

    this.onClickOutside = this.onClickOutside.bind(this)
    this.onClose = this.onClose.bind(this)
    this.open = this.open.bind(this)
  }

  createElement (props = {}) {
    const prefix = props.prefix || 'pa0'

    return html`
      <dialog class="${prefix} dialog-bottom h3-l bg-white black">
        <form id="form-dialog" name="form-dialog" method="dialog" class="flex flex-column flex-row-l ma0 h-100 relative">
          <div class="flex items-center flex-auto pv3 pv0-l">
            <p class="lh-copy pl3">To ensure you get the best experience <b>beta.resonate.is</b> uses cookies. <a href="https://resonate.is/cookie-policy" target="_blank" rel="noopener">Learn more</a>.</p>
          </div>
          <div class="flex flex-auto h-100 items-center justify-end pv3 pv0-l">
            <div class="mr3">
              ${button({ size: 'none', type: 'submit', value: 'decline', text: 'Decline' })}
            </div>
            <div class="mr4">
              ${button({ size: 'none', type: 'submit', value: 'allow', text: 'Allow cookies' })}
            </div>
          </div>
        </form>
      </dialog>
    `
  }

  open () {
    this.element.showModal()
  }

  close () {
    this.element.close()
  }

  /*
   * Remove component element from dom
   */

  destroy (silent) {
    if (silent) {
      this.element.removeAttribute('open')
    }
    document.body.removeChild(this.element)
  }

  onClose (e) {
    this.emit('cookies:setStatus', e.target.value || e.target.returnValue)

    this.destroy()
  }

  onClickOutside (e) {
    if (!this.element) return false
    const rect = this.element.getBoundingClientRect()
    const isInDialog = (rect.top <= e.clientY && e.clientY <= rect.top + rect.height &&
      rect.left <= e.clientX && e.clientX <= rect.left + rect.width)
    if (!isInDialog) {
      this.close()
    }
  }

  load (el) {
    dialogPonyfill().registerDialog(el)

    this.open()

    const animate = animation([
      { opacity: 0 },
      { opacity: 1 }
    ], {
      duration: 300,
      fill: 'forwards'
    })

    animate(el).play()

    this.element.addEventListener('close', this.onClose)

    this.element.addEventListener('click', this.onClickOutside)
  }
}

module.exports = CookieConsent
