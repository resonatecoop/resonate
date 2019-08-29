const html = require('choo/html')
const Nanocomponent = require('choo/component')
const assert = require('assert')
const rangeSlider = require('@resonate/rangeslider')

class ProgressBar extends Nanocomponent {
  constructor (name, state, emit) {
    super(name)

    this.state = state
    this.emit = emit

    this._progress = 0
    this._createSeeker = this._createSeeker.bind(this)
  }

  _createSeeker (el) {
    rangeSlider.create(el, {
      min: 0,
      max: 100,
      value: this._progress,
      step: 0.0001,
      rangeClass: 'progressBar',
      disabledClass: 'progressBar--disabled',
      fillClass: 'progressBar__fill',
      bufferClass: 'progressBar__buffer',
      backgroundClass: 'progressBar__background',
      handleClass: 'progressBar__handle'
    })

    return el.rangeSlider
  }

  get progress () {
    return this._progress
  }

  set progress (progress) {
    this._progress = progress
  }

  createElement (props) {
    assert(typeof props.progress, 'number', 'ProgressBar: progress must be a number')

    this._progress = props.progress

    if (!this.slider) {
      this._element = html`
        <div class="relative">
          <input id="progressBar" disabled="disabled" type="range" />
        </div>
      `
    }

    return this._element
  }

  load (el) {
    el.removeAttribute('unresolved')
    this.slider = this._createSeeker(el.querySelector('#progressBar'))
  }

  update (progress) {
    return progress !== this._progress
  }
}

module.exports = ProgressBar
