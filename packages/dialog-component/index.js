const html = require('nanohtml')
const Nanocomponent = require('nanocomponent')
const animation = require('nanoanimation')
const icon = require('@resonate/icon-element')
const dialogPonyfill = () => require('dialog-polyfill')

/**
 * Component wrapper for <dialog> element
 */

class Dialog extends Nanocomponent {
  constructor (name, state, emit) {
    super(name)

    this.state = state
    this.emit = emit

    this.onClickOutside = this.onClickOutside.bind(this)
    this.onClose = this.onClose.bind(this)
    this.open = this.open.bind(this)
  }

  createElement (props = {}) {
    if (props.onClose) {
      this.onClose = props.onClose.bind(this)
    }

    const content = props.content
    const title = props.title
    const prefix = props.prefix || 'pa0'

    return html`
      <dialog class=${prefix}>
        ${this.title ? html`<h3 class="f4 lh-title">${title}</h3>` : ''}
        <button form="form-dialog" class="absolute z-1 top-0 right-0 grow bg-transparent b--transparent dim pa2 ma0" type="submit">
          ${icon('close', { class: 'icon icon--sm fill-black' })}
        </button>
        <form id="form-dialog" name="form-dialog" method="dialog" class="ma0 relative">
          ${content}
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

  onClose () {
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

module.exports = Dialog
