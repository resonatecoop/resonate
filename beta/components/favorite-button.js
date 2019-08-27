const html = require('choo/html')
const Nanocomponent = require('choo/component')
const icon = require('@resonate/icon-element')
const nanologger = require('nanologger')
const nanostate = require('nanostate')

class FavButton extends Nanocomponent {
  constructor (fav) {
    super()

    this.log = nanologger('fav-button')

    this.machine = nanostate.parallel({
      fav: nanostate(fav ? 'on' : 'off', {
        on: { toggle: 'off' },
        off: { toggle: 'on' }
      })
    })

    this.machine.on('fav:toggle', () => {
      this.log.info('fav:toggle', this.machine.state.fav)
      this.rerender()
    })
  }

  createElement (props = {}) {
    const customClassList = props.classList || ''
    const classList = ['dim', 'flex-shrink-0', 'br-pill', 'pa2', 'ma0', 'bg-transparent', 'b--transparent'].join(' ')
    const iconElement = {
      on: () => icon('heart-outline', { class: 'icon fill-black fill-white--dark icon--sm' }),
      off: () => icon('heart-outline', { class: 'icon fill-black fill-white--dark icon--sm' })
    }[this.machine.state.fav]()

    const handler = (e) => {
      e.preventDefault()
      e.stopPropagation()
      this.machine.emit('fav:toggle')
    }

    return html`
      <button
        class="favorite-btn ${classList} ${customClassList}"
        onclick=${handler}>
        ${iconElement}
      </button>
    `
  }

  update () {
    return false
  }
}

module.exports = FavButton
