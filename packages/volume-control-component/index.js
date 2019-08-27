const html = require('nanohtml')
const Component = require('nanocomponent')
const rangeSlider = require('@resonate/rangeslider')
const button = require('@resonate/button')
const nanostate = require('nanostate')
const { background } = require('@resonate/theme-skins')
const Nanobounce = require('nanobounce')
const nanobounce = Nanobounce(300)

/*
 * Volume control using rangeslider-js (vertical)
 */

class VolumeControl extends Component {
  constructor (name, state, emit) {
    super(name)

    this.state = state
    this.emit = emit

    this._progress = 100

    this._onSlide = this._onSlide.bind(this)
    this._onSlideEnd = this._onSlideEnd.bind(this)
    this._createSlider = this._createSlider.bind(this)
    this._handleMouseEnter = this._handleMouseEnter.bind(this)
    this._handleMouseLeave = this._handleMouseLeave.bind(this)
    this._handleClick = this._handleClick.bind(this)
    this._update = this._update.bind(this)

    this.machine = nanostate.parallel({
      volume: nanostate('off', {
        on: { toggle: 'off' },
        off: { toggle: 'on' }
      })
    })
    this.machine.on('volume:toggle', this._update)
  }

  _update () {
    this.rerender()

    const el = this.element.querySelector('#volumecontrol')

    const button = this.element.querySelector('button')

    button.focus()

    if (el && !this.slider) {
      this.slider = this._createSlider(el)
    }
  }

  _createSlider (el) {
    rangeSlider.create(el, {
      min: 0,
      max: 100,
      value: this._progress,
      step: 0.0001,
      vertical: this._vertical,
      onSlide: this._onSlide,
      onSlideEnd: this._onSlideEnd
    })

    return el.rangeSlider
  }

  createElement (props) {
    const { vertical = true, sound = null } = props

    this._sound = sound
    this._vertical = vertical

    if (!this.slider) {
      this._element = html`
        <div class="volumeControl ${background} shadow-contour w-100 absolute h4 z-5" style="bottom:100%;margin-bottom:1px;">
          <input id="volumecontrol" type="range"/>
        </div>
      `
    }

    const volumeControlButton = button({
      iconName: 'volume',
      prefix: 'grow',
      style: 'blank'
    })

    const volumeOn = this.machine.state.volume === 'on'

    return html`
      <div class="flex w-100">
        <div class="relative" onmouseenter=${this._handleMouseEnter} onmouseleave=${this._handleMouseLeave}>
          ${volumeControlButton}
          ${volumeOn ? this._element : ''}
        </div>
      </div>
    `
  }

  _handleClick () {
    this.machine.emit('volume:toggle')
  }

  _handleMouseLeave (e) {
    const volumeOn = this.machine.state.volume === 'on'
    const eventName = volumeOn ? 'volume:toggle' : false

    return nanobounce(() => {
      if (eventName) this.machine.emit(eventName)
      this.button.removeEventListener('click', this._handleClick)
    })
  }

  _handleMouseEnter (e) {
    const volumeOff = this.machine.state.volume === 'off'
    const eventName = volumeOff ? 'volume:toggle' : false

    this.button.removeEventListener('click', this._handleClick)

    return nanobounce(() => {
      if (eventName) this.machine.emit(eventName)
      this.button = this.element.querySelector('button')
      this.button.addEventListener('click', this._handleClick)
    })
  }

  _onSlide (value, percent, position) {
    const rangeSlider = this.element.querySelector('.rangeSlider')
    if (rangeSlider) rangeSlider.classList.toggle('js-rangeslider__sliding', true)
    this._progress = value
    if (this._sound) this._sound.volume(percent)
  }

  load () {
    this.button = this.element.querySelector('button')
    this.button.addEventListener('click', this._handleClick)
  }

  _onSlideEnd (value, percent, position) {
    const rangeSlider = this.element.querySelector('.rangeSlider')
    if (rangeSlider) rangeSlider.classList.toggle('js-rangeslider__sliding', false)
  }

  update (props) {
    return false
  }
}

module.exports = VolumeControl
