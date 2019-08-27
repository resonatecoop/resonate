const { isBrowser } = require('browser-or-node')
const html = require('nanohtml')
const Component = require('nanocomponent')
const nanologger = require('nanologger')
const morph = require('nanomorph')
const clock = require('mm-ss')
const nanostate = require('nanostate')

const Player = require('@resonate/player-component')
const Dialog = require('@resonate/dialog-component')
const PlayCount = require('@resonate/play-count')
const MenuButton = require('@resonate/menu-button')
const icon = require('@resonate/icon-element')
const button = require('@resonate/button')
const renderCounter = require('@resonate/counter')

const { iconFill, text } = require('@resonate/theme-skins')

const renderTime = (time, opts = {}) => {
  return html`
    <div class=${opts.class || 'currentTime'}>${time > 0 ? clock(time) : ''}</div>
  `
}

class Track extends Component {
  constructor (name, state, emit) {
    super(name)

    this.emit = emit
    this.state = state

    this.player = isBrowser ? state.cache(Player, 'player-footer') : {}

    this._handlePlayPause = this._handlePlayPause.bind(this)
    this._handleDoubleClick = this._handleDoubleClick.bind(this)
    this._toggleFavorite = this._toggleFavorite.bind(this)
    this._openSharingDialog = this._openSharingDialog.bind(this)

    this.renderPlaybackButton = this.renderPlaybackButton.bind(this)

    this._isPlaying = this._isPlaying.bind(this)
    this._isActive = this._isActive.bind(this)
    this._update = this._update.bind(this)

    this.renderMenuButton = this.renderMenuButton.bind(this)

    this.machine = nanostate.parallel({
      hover: nanostate('off', {
        on: { off: 'off' },
        off: { on: 'on' }
      }),
      favorite: nanostate('no', {
        yes: { toggle: 'no' },
        no: { toggle: 'yes' }
      }),
      sharingDialog: nanostate('close', {
        open: { close: 'close' },
        close: { open: 'open' }
      })
    })

    this.log = nanologger(name)

    this._fav = 0
  }

  createElement (props) {
    this._index = props.index
    this._playlist = props.playlist
    this._count = props.count
    this._src = props.src
    this._track = props.track
    this._showArtist = props.showArtist
    this._trackGroup = props.trackGroup
    this._theme = props.theme || false
    this._type = props.type
    this._fav = props.fav

    return html`
      <li tabindex=0 class="track-component flex items-center w-100 mb2">
        <div class="flex items-center flex-auto">
          ${this.renderPlaybackButton()}
          <div onclick=${(e) => e.preventDefault()} ondblclick=${this._handleDoubleClick} class="metas no-underline truncate flex flex-column pl2 pr2 items-start justify-center w-100">
            ${renderTitle(this._track.title)}
            ${this._showArtist ? renderArtist(this._trackGroup[0].display_artist) : ''}
          </div>
        </div>
        <div class="flex flex-auto flex-shrink-0 justify-end items-center">
          ${this._track.status !== 'free' ? renderPlayCount(this._count, this._track.id) : ''}
          ${this.renderMenuButton()}
          <div class="w3 tc">
            ${renderTime(this._track.duration, { class: 'duration' })}
          </div>
        </div>
      </li>
    `

    function renderTitle (title) {
      return html`
        <span class="pa0 track-title truncate f5 w-100">
          ${title}
        </span>
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

  renderMenuButton () {
    const menuButton = new MenuButton(`track-menu-button-${this._track.id}`, this.state, this.emit).render({
      hover: false, // disabled activation on mousehover
      items: [
        { iconName: 'star', text: this._fav === 0 ? 'favorite' : 'unfavorite', actionName: 'favorite:toggle' },
        { iconName: 'share', text: 'share', actionName: 'sharingDialog:open' },
        { iconName: 'info', text: 'artist profile', actionName: 'artist:profile' }
      ],
      updateLastAction: (eventName) => {
        if (eventName === 'artist:profile') {
          return this.emit(this.state.events.PUSHSTATE, `/artists/${this._trackGroup[0].id}`)
        }
        return this.machine.emit(eventName)
      },
      id: `super-button-${this._track.id}`,
      orientation: 'left', // popup menu orientation
      style: 'blank',
      size: 'small',
      caret: true,
      iconName: 'dropdown' // button icon
    })

    return html`
      <div class="menu_button flex items-center relative mh2">
        ${menuButton}
      </div>
    `
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

    this.machine.on('sharingDialog:open', this._openSharingDialog)
    this.machine.on('favorite:toggle', this._toggleFavorite)

    this.machine.on('hover:on', this._update)
    this.machine.on('hover:off', this._update)

    this.player.playback.on('paused', this._update)
    this.player.playback.on('playing', this._update)
  }

  unload (el) {
    el.removeEventListener('mouseenter', this._mouseEnter)
    el.removeEventListener('mouseleave', this._mouseLeave)

    this.machine.removeListener('hover:on', this._update)
    this.machine.removeListener('hover:off', this._update)

    this.machine.removeListener('sharingDialog:open', this._openSharingDialog)
    this.machine.removeListener('favorite:toggle', this._toggleFavorite)

    this.player.playback.removeListener('playing', this._update)
    this.player.playback.removeListener('paused', this._update)
  }

  update (props) {
    return false
  }

  _openSharingDialog () {
    const self = this
    const id = this._track.id
    const embedCode = `<iframe src="https://beta.resonate.is/embed/tracks/${id}" style="margin:0;border:none;width:400px;height:600px;border: 1px solid #000;"></iframe>`
    const link = `https://beta.resonate.is/tracks/${id}`

    const copyEmbedCodeButton = button({
      prefix: 'bg-black white ma0 bn absolute top-0 right-0 dim',
      onClick: (e) => { e.preventDefault(); this.emit('clipboard', embedCode) },
      style: 'none',
      size: 'none',
      text: 'Copy'
    })
    const dialogContent = html`
      <div class="flex flex-column">
        <p class="lh-copy">Use the following link to send this track to someone</p>

        <a onclick=${(e) => { e.preventDefault(); this.emit('clipboard', link) }} class="link b" href=${link}>${link}</a>

        <p class="lh-copy">To embed this track, copy the following code into an html page or webform</p>

        <div class="relative flex flex-column">
          <code class="ba bw b--gray pa2 f7">
            ${embedCode}
          </code>
          ${copyEmbedCodeButton}
        </div>
      </div>
    `
    const dialogEl = this.state.cache(Dialog, 'share-track-dialog').render({
      title: 'Share or embed',
      prefix: 'dialog-default dialog--sm',
      content: dialogContent,
      onClose: function (e) {
        self.machine.emit('sharingDialog:close')
        this.destroy()
      }
    })

    document.body.appendChild(dialogEl)
  }

  async _toggleFavorite () {
    if (!this.state.api.user.uid) {
      return this.emit(this.state.events.PUSHSTATE, '/login')
    }

    try {
      const response = await this.state.api.tracks.favorites.setFavorite({
        uid: this.state.api.user.uid,
        tid: this._track.id,
        type: this._fav === 1 ? 0 : 1
      })

      this._fav = response.data.type

      morph(this.element.querySelector('.menu_button'), this.renderMenuButton())

      this.emit('notify', { message: response.data.type === 1 ? 'Track added to favorites' : 'Track removed from favorites' })
    } catch (error) {
      this.log.error(error)
    }
  }

  renderPlaybackButton () {
    const iconSize = this._type === 'album' ? 'icon--xs' : 'icon--sm'
    const renderIcon = () => icon(this._isPlaying() ? 'pause' : 'play', { class: `icon ${iconSize} ${iconFill}` })
    const renderIndex = () => html`<span class=${text}>${this._index}</span>`

    const renderArtwork = () => {
      const imageUrl = this._track.cover.replace('600x600', '120x120')
      return html`
        <span class="db w-100 aspect-ratio aspect-ratio--1x1 bg-near-black">
          <img src=${imageUrl} decoding="auto" class="z-1 aspect-ratio--object">
          ${this._isActive() || this.machine.state.hover === 'on' ? html`<span class="absolute absolute-fill bg-white-60 bg-black-60--dark bg-white-60--light z-2 flex items-center justify-center w-100 h-100">
            ${renderIcon()}
          </span>` : ''}
        </span>
      `
    }

    const withTracking = !this._isActive() && this._index !== 0 ? {
      on: renderIcon(),
      off: renderIndex()
    }[this.machine.state.hover] : renderIcon()

    const button = {
      album: withTracking
    }[this._type] || renderArtwork()

    const buttonSize = this._type === 'album' ? 'w1 h1' : 'w3 h3'
    return html`
      <button
        class="playback-button pa0 ${buttonSize} relative bn bg-transparent flex-shrink-0"
        onclick=${this._handlePlayPause}
      >

        <div class="play-button-inner flex items-center justify-center absolute w-100 h-100 top-0">
          ${button}
        </div>
      </button>
    `
  }

  _handlePlayPause (e) {
    e.preventDefault()
    e.stopPropagation()

    const isNew = this.player.src !== this._src

    if (isNew) {
      this.player.src = this._src
      this.player.track = this._track
      this.player.trackGroup = this._trackGroup
      this.player.fav = this._fav
      this.player.count = this._count
      this.player.playlist = this._playlist
      this.player.index = this._playlist.findIndex((item) => item.track.id === this._track.id)
    }

    const eventName = {
      idle: 'play',
      playing: 'pause',
      paused: 'play',
      stopped: 'play'
    }[this.player.playback.state]

    if (!eventName) return false

    this.log.info(eventName)

    this.player.playback.emit(eventName)

    if (isNew && this.player.playback.state === 'paused') {
      this.player.playback.emit('play')
    }

    this._update()
  }

  _handleDoubleClick (e) {
    e.preventDefault()

    if (e.target.nodeName !== 'button') {
      return this._handlePlayPause(e)
    }
  }

  _isActive () {
    return this._src === this.player.src
  }

  _isPlaying () {
    return this._isActive() && this.player.playback.state === 'playing'
  }

  _update () {
    if (!this.element) return
    morph(this.element.querySelector('.playback-button'), this.renderPlaybackButton())
  }
}

module.exports = Track
