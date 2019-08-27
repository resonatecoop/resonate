const html = require('choo/html')
const Component = require('choo/component')
const animation = require('nanoanimation')
const dialogPolyfill = () => require('dialog-polyfill')
const validateFormdata = require('validate-formdata')
const noop = () => {}
const button = require('@resonate/button')

/**
 * Component wrapper for <dialog> element
 */

class Dialog extends Component {
  constructor (name, state, emit) {
    super(name)
    this.name = name
    this.state = state
    this.emit = emit

    this.onClickOutside = this.onClickOutside.bind(this)
    this.onClose = this.onClose.bind(this)
    this.close = this.close.bind(this)
    this.open = this.open.bind(this)
    this.validator = validateFormdata()
    this.form = this.validator.state
  }

  createElement (props = {}) {
    this.content = props.content || noop
    if (this.content) {
      this.content = this.content.bind(this)
    }
    this.validator = props.validator || this.validator
    this.onSubmit = props.onSubmit || noop
    this.onSubmit = this.onSubmit.bind(this)
    this.form = props.form || this.form || {
      changed: false,
      valid: true,
      pristine: {},
      required: {},
      values: {},
      errors: {}
    }

    if (props.onClose) {
      this.onClose = props.onClose.bind(this)
    }

    this.title = props.title
    this.classList = props.classList || 'pa0'

    return html`
      <dialog class=${this.classList}>
        ${this.title ? html`<h3>${this.title}</h3>` : ''}
        ${button({
      onClick: () => this.close(),
      size: 'small',
      classList: 'color-inherit bn dim absolute top-0 right-0',
      iconName: 'close',
      iconSize: 'xs'
    })}
        <form novalidate id="form-dialog" method="dialog" class="ma0 relative" onsubmit=${this.onSubmit}>
          ${this.content()}
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
    const rect = this.element.getBoundingClientRect()
    const isInDialog = (rect.top <= e.clientY && e.clientY <= rect.top + rect.height &&
      rect.left <= e.clientX && e.clientX <= rect.left + rect.width)
    if (!isInDialog) {
      this.close()
    }
  }

  load (el) {
    dialogPolyfill().registerDialog(this.element)

    this.open()

    const animate = animation([
      { opacity: 0 },
      { opacity: 1 }
    ], {
      duration: 300,
      fill: 'forwards'
    })

    const move = animate(this.element, () => {
      console.log('Animation done')
    })

    move.play()

    this.element.addEventListener('close', this.onClose)

    this.element.addEventListener('click', this.onClickOutside)
  }
}

module.exports = Dialog
