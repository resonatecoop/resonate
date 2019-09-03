const Component = require('choo/component')
const nanostate = require('nanostate')
const nanologger = require('nanologger')
const html = require('choo/html')
const css = require('sheetify')
const icon = require('@resonate/icon-element')
const { iconFillInvert } = require('@resonate/theme-skins')

const prefix = css`
  :host li.active button {
    border-color: var(--white);
  }
  @media (prefers-color-scheme: dark) {
    :host li.active button {
      border-color: var(--black);
    }
  }
  .color-scheme--dark :host li.active button {
    border-color: var(--black);
  }
  .color-scheme--light :host li.active button {
    border-color: var(--white);
  }
  :host input {
    opacity: 0;
    width: 0;
    height: 0;
  }
  :host input:active ~ label {
    opacity: 1;
  }
  :host input:checked ~ label {
    opacity: 1;
  }
  :host input:disabled ~ label {
    opacity: .5;
  }
  :host input:checked ~ label .icon {
    fill: var(--white);
  }
  :host label .icon {
    fill: transparent;
    stroke: var(--white);
  }
  @media (prefers-color-scheme: dark) {
    :host label .icon {
      stroke: var(--black);
    }
  }
  .color-scheme--dark :host label .icon {
    stroke: var(--black);
  }
  .color-scheme--light :host label .icon {
    stroke: var(--white);
  }
  @media (prefers-color-scheme: dark) {
    :host input:checked ~ label .icon {
      fill: var(--black);
    }
  }
  .color-scheme--dark :host input:checked ~ label .icon {
    fill: var(--black);
  }
  .color-scheme--light :host input:checked ~ label .icon {
    fill: var(--white);
  }
  @media (prefers-color-scheme: dark) {
    :host label .icon {
      stroke: var(--black);
    }
  }
  .color-scheme--dark :host label .icon {
    stroke: var(--black);
  }
  .color-scheme--light :host label .icon {
    stroke: var(--white);
  }
  :host label:hover {
    opacity: .5;
  }
`

class ThemeSwitcher extends Component {
  constructor (name, state, emit) {
    super(name)

    this.emit = emit
    this.state = state

    this.log = nanologger(name)

    this.machine = nanostate.parallel({
      theme: nanostate(this.state.theme, {
        dark: { toggle: 'light' },
        light: { toggle: 'dark' }
      })
    })

    this.machine.on('theme:toggle', () => {
      this.log.info('theme:toggle', this.machine.state.theme)
      this.emit('theme', { theme: this.machine.state.theme, auto: this.auto })
      this.rerender()
    })

    this._handleKeyPress = this._handleKeyPress.bind(this)
    this._handleChange = this._handleChange.bind(this)
    this._handleAutoChange = this._handleAutoChange.bind(this)
  }

  createElement () {
    return html`
      <div class="${prefix} flex flex-column w-100">
        <form>
          <div class="flex w-100">
            <div class="flex items-center flex-auto">
              <input type="radio" disabled=${!!this.auto} name="theme" checked=${this.machine.state.theme === 'dark'} id="chooseDark" onchange=${this._handleChange} value="dark">
              <label tabindex="0" onkeypress=${this._handleKeyPress} class="flex flex-auto items-center justify-center w-100" for="chooseDark">
                <div class="pa3 flex justify-center w-100 flex-auto">
                  ${icon('circle', { class: `icon icon--sm ${iconFillInvert}` })}
                </div>
                <div class="pv3 flex w-100 flex-auto">
                  Dark
                </div>
              </label>
            </div>
            <div class="flex items-center flex-auto">
              <input type="radio" disabled=${!!this.auto} name="theme" checked=${this.machine.state.theme === 'light'} id="chooseLight" onchange=${this._handleChange} value="light">
              <label tabindex="0" onkeypress=${this._handleKeyPress} class="flex flex-auto items-center justify-center w-100" for="chooseLight">
                <div class="pa3 flex justify-center w-100 flex-auto">
                  ${icon('circle', { class: `icon icon--sm ${iconFillInvert}` })}
                </div>
                <div class="pv3 flex w-100 flex-auto">
                  Light
                </div>
              </label>
            </div>
            <div class="flex items-center flex-auto">
              <input type="checkbox" name="theme" checked=${!!this.auto} id="chooseAuto" onchange=${this._handleAutoChange} value="auto">
              <label tabindex="0" class="flex flex-auto items-center justify-center w-100" for="chooseAuto">
                <div class="pa3 flex justify-center w-100 flex-auto">
                  ${icon('square', { class: `icon icon--sm ${iconFillInvert}` })}
                </div>
                <div class="pv3 lex w-100 flex-auto">
                  Auto
                </div>
              </label>
            </div>
          </div>
        </form>
      </div>
    `
  }

  _handleAutoChange () {
    this.auto = !this.auto
    this.rerender()
    this.emit('theme', { theme: this.machine.state.theme, auto: this.auto })
  }

  _handleChange (e) {
    return (this.machine.state.theme !== e.target.value) && this.machine.emit('theme:toggle')
  }

  _handleKeyPress (e) {
    if (e.key === 'Enter') {
      e.preventDefault()
      e.target.control.checked = !e.target.control.checked
      return (this.machine.state.theme !== e.target.control.value) && this.machine.emit('theme:toggle')
    }
    return false
  }

  beforerender () {
    this.auto = window.localStorage.getItem('color-scheme-auto') === 'true'
  }

  update () {
    return false
  }
}

module.exports = ThemeSwitcher
