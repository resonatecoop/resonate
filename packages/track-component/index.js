const { isBrowser } = require('browser-or-node')
const html = require('nanohtml')
const Component = require('nanocomponent')
const nanologger = require('nanologger')
const morph = require('nanomorph')
const clock = require('mm-ss')
const nanostate = require('nanostate')
const PlayCount = require('@resonate/play-count')
const MenuButton = require('@resonate/menu-button')
const icon = require('@resonate/icon-element')
const renderCounter = require('@resonate/counter')
const menuOptions = require('@resonate/menu-button-options')
const { iconFill, text } = require('@resonate/theme-skins')

const renderTime = (time, opts = {}) => {
  return html`
    <div class=${opts.class || 'currentTime'}>${time > 0 ? clock(time) : ''}</div>
  `
}

class Track extends Component {
  constructor (id, state, emit) {
    super(id)

    this.emit = emit
    this.state = state

    this.local = {}

    this._handlePlayPause = this._handlePlayPause.bind(this)
    this._handleKeyPress = this._handleKeyPress.bind(this)
    this._handleDoubleClick = this._handleDoubleClick.bind(this)

    this._isActive = this._isActive.bind(this)
    this._update = this._update.bind(this)

    this.machine = nanostate.parallel({
      hover: nanostate('off', {
        on: { off: 'off' },
        off: { on: 'on' }
      })
    })

    this.log = nanologger(id)
  }

  createElement (props = {}) {
    this.local.index = props.index
    this.local.playlist = props.playlist
    this.local.count = props.count
    this.local.src = props.src
    this.local.track = props.track
    this.local.trackGroup = props.trackGroup
    this.local.theme = props.theme || false
    this.local.type = props.type

    const showArtist = props.showArtist

    return html`
      <li tabindex=0 class="track-component flex items-center w-100 mb2" onkeypress=${this._handleKeyPress}>
        <div class="flex items-center flex-auto">
          ${this.renderPlaybackButton()}
          <div ondblclick=${this._handleDoubleClick} class="metas no-underline truncate flex flex-column pl2 pr2 items-start justify-center w-100">
            <span class="pa0 track-title truncate f5 w-100">
              ${this.local.track.title}
            </span>
            ${showArtist ? renderArtist(this.local.trackGroup[0].display_artist) : ''}
          </div>
        </div>
        <div class="flex flex-auto flex-shrink-0 justify-end items-center">
          ${this.local.track.status !== 'free' ? renderPlayCount(this.local.count, this.local.track.id) : ''}
          ${renderMenuButton(Object.assign({ id: this.local.track.id, data: this.local, orientation: 'left' },
            menuOptions(this.state, this.emit, this.local))
          )}
          <div class="w3 tc">
            ${renderTime(this.local.track.duration, { class: 'duration' })}
          </div>
        </div>
      </li>
    `

    function renderMenuButton (options) {
      const { id, data, orientation = 'top', items: menuItems, open } = options
      const menuButton = new MenuButton(`track-menu-button-${id}`)

      return html`
        <div class="menu_button flex items-center relative mh2">
          ${menuButton.render({
            hover: false, // disabled activation on mousehover
            items: menuItems,
            updateLastAction: (actionName) => {
              const callback = menuItems.find(item => item.actionName === actionName).updateLastAction
              return callback(data)
            },
            open: open,
            orientation, // popup menu orientation
            style: 'blank',
            size: 'small',
            iconName: 'dropdown' // button icon
          })}
        </div>
      `
    }

    function renderArtist (name) {
      return html`
        <span class="pa0 track-title truncate f5 w-100 dark-gray mid-gray--dark dark-gray--light">
          ${name}
        </span>
      `
    }

    function renderPlayCount (count, tid) {
      const playCount = new PlayCount(count)

      if (isBrowser) {
        const counter = renderCounter(`cid-${tid}`)
        playCount.counter = counter
      }
      return html`
        <div class="flex items-center">
          ${playCount.counter}
        </div>
      `
    }
  }

  _mouseLeave () {
    return this.machine.state.hover === 'on' && this.machine.emit('hover:off')
  }

  _mouseEnter () {
    if (/Mobi|Android/i.test(navigator.userAgent)) return
    return this.machine.state.hover === 'off' && this.machine.emit('hover:on')
  }

  beforerender (el) {
    el.addEventListener('mouseenter', this._mouseEnter.bind(this))
    el.addEventListener('mouseleave', this._mouseLeave.bind(this))

    this.machine.on('hover:on', this._update)
    this.machine.on('hover:off', this._update)

    const player = this.state.components['player-footer']

    player.playback.on('paused', this._update)
    player.playback.on('playing', this._update)
  }

  unload (el) {
    el.removeEventListener('mouseenter', this._mouseEnter)
    el.removeEventListener('mouseleave', this._mouseLeave)

    this.machine.removeListener('hover:on', this._update)
    this.machine.removeListener('hover:off', this._update)

    const player = this.state.components['player-footer']

    player.playback.removeListener('playing', this._update)
    player.playback.removeListener('paused', this._update)
  }

  update (props) {
    return false
  }

  renderPlaybackButton () {
    const iconSize = this.local.type === 'album' ? 'xs' : 'sm'
    const renderIcon = () => icon(this.playing() ? 'pause' : 'play', { size: iconSize, class: iconFill })
    const renderIndex = () => html`<span class=${text}>${this.local.index}</span>`

    const renderArtwork = () => {
      const imageUrl = this.local.track.cover.replace('x600', 'x120')
      return html`
        <span class="db w-100 aspect-ratio aspect-ratio--1x1 bg-near-black">
          <img src=${imageUrl} decoding="auto" class="z-1 aspect-ratio--object">
          ${this._isActive() || this.machine.state.hover === 'on' ? html`<span class="absolute absolute-fill bg-white-60 bg-black-60--dark bg-white-60--light z-2 flex items-center justify-center w-100 h-100">
            ${renderIcon()}
          </span>` : ''}
        </span>
      `
    }

    const withTracking = !this._isActive() && this.local.index !== 0 ? {
      on: renderIcon(),
      off: renderIndex()
    }[this.machine.state.hover] : renderIcon()

    const button = {
      album: withTracking
    }[this.local.type] || renderArtwork()

    const buttonSize = this.local.type === 'album' ? 'w1 h1' : 'w3 h3'

    const attrs = {
      type: 'button',
      title: this.playing() ? 'Pause' : 'Play',
      class: `playback-button pa0 ${buttonSize} relative bn bg-transparent flex-shrink-0`,
      onclick: this._handlePlayPause
    }

    return html`
      <button ${attrs}>
        <div class="play-button-inner flex items-center justify-center absolute w-100 h-100 top-0">
          ${button}
        </div>
      </button>
    `
  }

  _handleKeyPress (e) {
    if (e.key === 'Enter') {
      return this._handlePlayPause(e)
    }
  }

  _handlePlayPause (e) {
    e.preventDefault()
    e.stopPropagation()

    const player = this.state.components['player-footer'] || {}

    const isNew = player.src !== this.local.src

    if (isNew) {
      player.src = this.local.src
      player.track = this.local.track
      player.trackGroup = this.local.trackGroup
      player.fav = this.local.fav
      player.count = this.local.count
      player.playlist = this.local.playlist
      player.index = this.local.playlist.findIndex((item) => item.track.id === this.local.track.id)
    }

    const eventName = {
      idle: 'play',
      playing: 'pause',
      paused: 'play',
      stopped: 'play'
    }[player.playback.state]

    if (!eventName) return false

    this.log.info(eventName)

    player.playback.emit(eventName)

    if (isNew && player.playback.state === 'paused') {
      player.playback.emit('play')
    }

    this._update()
  }

  _handleDoubleClick (e) {
    if (e.target.nodeName !== 'button') {
      return this._handlePlayPause(e)
    }
  }

  _isActive () {
    const player = this.state.components['player-footer'] || {}

    return this.local.src === player.src
  }

  playing () {
    const player = this.state.components['player-footer']
    return this._isActive() && player.playback.state === 'playing'
  }

  _update () {
    if (!this.element) return
    morph(this.element.querySelector('.playback-button'), this.renderPlaybackButton())
  }
}

module.exports = Track
