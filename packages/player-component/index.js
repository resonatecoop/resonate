/* global MediaMetadata */

const { isBrowser } = require('browser-or-node')
const assert = require('assert')

const html = require('nanohtml')
const Nanocomponent = require('nanocomponent')
const nanostate = require('nanostate')
const morph = require('nanomorph')

const renderCounter = require('@resonate/counter')
const icon = require('@resonate/icon-element')
const button = require('@resonate/button')

const Artwork = require('@resonate/artwork-component')
const PlayCount = require('@resonate/play-count')
const NanoPlayer = require('@resonate/nanoplayer')
const Dialog = require('@resonate/dialog-component')
const MenuButton = require('@resonate/menu-button')
const Seeker = require('@resonate/seeker-component')
const VolumeControl = require('@resonate/volume-control-component')
const RoComponent = require('resize-observer-component')
const Ro = require('resize-observer-polyfill')

const Nanobounce = require('nanobounce')
const nanobounce = Nanobounce()

const breakpoint = size => {
  if (!isBrowser) return true

  const breakpoint = {
    ns: 'screen and (min-width: 30em)',
    m: 'screen and (min-width: 30em) and (max-width: 60em)',
    lg: 'screen and (min-width: 60em)'
  }[size]

  return window.matchMedia(breakpoint).matches
}

/*
 * Logging
 */
const logger = require('nanologger')
const log = logger('player')
const clock = require('mm-ss')

class Player extends Nanocomponent {
  constructor (name, state, emit) {
    super(name)

    this.state = state
    this.name = name
    this.emit = emit // optional

    this._progress = 0
    this.duration = 0

    this.sound = new NanoPlayer(isBrowser ? new window.Audio() : {})

    /**
     * user actions
     */

    this._play = this._play.bind(this)
    this._pause = this._pause.bind(this)
    this._stop = this._stop.bind(this)
    this._previous = this._previous.bind(this)
    this._next = this._next.bind(this)
    this._timeupdate = this._timeupdate.bind(this)
    this._loadedmetadata = this._loadedmetadata.bind(this)
    this._ended = this._ended.bind(this)
    this._handlePlayPause = this._handlePlayPause.bind(this)
    this._toggleFavorite = this._toggleFavorite.bind(this)
    this._openSharingDialog = this._openSharingDialog.bind(this)
    this._toggleFullscreen = this._toggleFullscreen.bind(this)

    /*
     * Mutate component instead of rerendering everything
     */
    this._update = this._update.bind(this)

    /*
     * Template
     */

    this.renderControls = this.renderControls.bind(this)
    this.renderPlayer = this.renderPlayer.bind(this)
    this.renderMenuButton = this.renderMenuButton.bind(this)

    this.playback = nanostate('idle', {
      idle: { play: 'playing' },
      playing: { pause: 'paused', stop: 'stopped' },
      paused: { play: 'playing', stop: 'stopped' },
      stopped: { play: 'playing' }
    })

    this.playback.event('previous', nanostate('previous', {
      previous: { play: 'playing', stop: 'stopped' }
    }))

    this.playback.event('next', nanostate('next', {
      next: { play: 'playing', stop: 'stopped' }
    }))

    this.playback.on('playing', this._play)
    this.playback.on('paused', this._pause)
    this.playback.on('stopped', this._stop)
    this.playback.on('previous', this._previous)
    this.playback.on('next', this._next)

    this.machine = nanostate.parallel({
      favorite: nanostate('no', {
        yes: { toggle: 'no' },
        no: { toggle: 'yes' }
      }),
      fullscreen: nanostate('off', {
        on: { toggle: 'off' },
        off: { toggle: 'on' }
      }),
      sharingDialog: nanostate('close', {
        open: { close: 'close' },
        close: { open: 'open' }
      })
    })

    this.machine.on('favorite:toggle', this._toggleFavorite)
    this.machine.on('sharingDialog:open', this._openSharingDialog)
    this.machine.on('fullscreen:toggle', this._toggleFullscreen)

    this.sound.on('loadedmetadata', this._loadedmetadata)
    this.sound.on('ended', this._ended)
    this.sound.on('timeupdate', this._timeupdate)
    this.sound.on('error', (reason) => {
      this.emit('player:error', { reason })
    })
  }

  renderTime (t = 0, opts = {}) {
    return html`
      <div class=${opts.class || 'currentTime'}>${t > 0 ? clock(t) : ''}</div>
    `
  }

  createElement (props) {
    assert.strictEqual(typeof props, 'object', 'props should be an object')

    this.setUrl = props.setUrl

    if (!this._track) {
      this._track = props.track || {}
      this._playlist = props.playlist || []
      this._fav = props.fav
      this._trackGroup = props.trackGroup || [{}]
      this._count = props.count
      this._index = this._playlist.findIndex((item) => item.track.id === this._track.id)

      if (props.src !== null && props.src !== this.src) {
        this.src = props.src
        this.sound.load(this.setUrl(this.src))
      }
    }

    const playerComponent = this.renderPlayer()

    const container = new RoComponent()

    return html`
      <div class="flex flex-column h-100">
        ${container.render(playerComponent)}
      </div>
    `
  }

  renderPlayer () {
    const artwork = {
      on: () => {
        const image = new Artwork().render({
          url: this._track.cover,
          style: {
            width: 'auto',
            maxHeight: 'calc(100vh - (var(--height-3) * 3) - var(--height-2))' /* minus header and footer player */
          },
          animate: true
        })
        const disableFullScreenButton = button({
          style: 'blank',
          prefix: 'absolute z-1 top-0 right-0',
          onClick: (e) => this.machine.emit('fullscreen:toggle'),
          title: 'Disable fullscreen',
          iconName: 'close'
        })

        return html`
          <div class="artwork-fullscreen w-100 h-100">
            ${disableFullScreenButton}
            <div class="player-artwork flex flex-auto justify-center items-start w-100 h-100 relative">
              ${image}
            </div>
          </div>`
      },
      off: () => {}
    }[this.machine.state.fullscreen]()

    const controls = this.renderControls()

    return html`
      <div class="player-component flex flex-column h-100">
        ${artwork}
        ${controls}
      </div>
    `
  }

  renderControls () {
    const playing = this.playback.state === 'playing'

    const hasPlaylist = this._playlist.length

    const renderInfos = ({ title, artist }) => html`
      <div class="infos flex flex-auto flex-column justify-center">
        <div class="flex flex-column justify-end">
          <span class="track-title truncate f5">
            ${title}
          </span>
          <span class="track-artist truncate f5 dark-gray mid-gray--dark dark-gray--light">
            ${artist}
          </span>
        </div>
      </div>
    `

    const playPauseButton = button({
      style: 'blank',
      prefix: 'play-button',
      onClick: this._handlePlayPause,
      title: playing ? 'Pause' : 'Play',
      iconName: playing ? 'pause' : 'play'
    })

    const infos = renderInfos({ title: this._track.title, artist: this._trackGroup[0].display_artist })

    const prevButton = button({
      style: 'blank',
      disabled: !hasPlaylist,
      onClick: (e) => this.playback.emit('previous'),
      title: 'Previous track',
      iconName: 'previous'
    })

    const nextButton = button({
      style: 'blank',
      disabled: !hasPlaylist,
      onClick: (e) => this.playback.emit('next'),
      title: 'Next track',
      iconName: 'next'
    })

    const renderPlayCount = () => {
      const playCount = new PlayCount(this._count)
      if (isBrowser) {
        playCount.counter = renderCounter(`cid-${this._track.id}`)
      }
      return html`
        <div class="flex items-center mr2 ph2">
          ${playCount.counter}
        </div>
      `
    }

    const renderFullScreenButton = (props) => {
      const title = this.machine.state.fullscreen === 'on' ? 'Disable fullscreen' : 'Enable fullscreen'
      const imageUrl = this._track.cover ? this._track.cover.replace('600x600', '120x120') : '/assets/default.png'
      const handleClick = (e) => this.machine.emit('fullscreen:toggle')
      return html`
        <div class="flex">
          <button title=${title} class="h3 w3 relative bn bg-transparent" onclick=${handleClick}>
            <span class="w-100 db aspect-ratio aspect-ratio--1x1 bg-near-black">
              <img src=${imageUrl} decoding="auto" class="aspect-ratio--object">
            </span>
          </button>
        </div>
      `
    }

    const renderSeeker = (options = {}) => {
      if (breakpoint('lg') || options.force) {
        this.seeker = this.state.cache(Seeker, 'player-seeker')

        return html`
          <div class="seeker z-1 flex flex-auto flex-column relative bw bl br b--mid-gray b--near-black--dark">
            ${this.seeker.render({ progress: this._progress, sound: this.sound })}
            <div class="absolute w-100 h-100 flex items-center justify-center" style="z-index:-1;">
              <span class="pl2 flex flex-auto">${this.renderTime(this._currentTime)}</span>
              <span class="pr2 flex flex-auto justify-end">
                ${this.renderTime(this.duration, { class: 'duration' })}
              </span>
            </div>
          </div>
        `
      }
    }

    const renderVolumeControl = (name = 'volume-control', options = {}) => {
      if (breakpoint('ns') || options.force) {
        const volumeControl = this.state.cache(VolumeControl, name)
        return volumeControl.render({ vertical: true, sound: this.sound })
      }
    }

    const controls = {
      on: () => {
        return html`
          <div class="controls flex flex-column flex-auto flex-column h-100 bt bw b--mid-gray b--near-black--dark">
            <div class="flex flex-auto">
              <div class="flex w-100 flex-auto ml2">
                ${renderVolumeControl('player-volume-control-fullscreen', { force: true })}
              </div>
              <div class="flex w-100 justify-center flex-auto">
                ${prevButton}
                ${playPauseButton}
                ${nextButton}
              </div>
              <div class="flex w-100 flex-auto justify-end mr2">
                ${renderPlayCount()}
              </div>
            </div>
            <div class="bg-near-white bg-near-white--light bg-near-black--dark flex flex-auto w-100 h2">
              ${renderSeeker({ force: true })}
            </div>
            <div class="flex w-100 flex-auto">
              <div class="flex flex-auto w-100">
                ${renderFullScreenButton()}
                ${infos}
                ${this.renderMenuButton({ orientation: 'topright' })}
              </div>
            </div>
          </div>
        `
      },
      off: () => {
        return html`
          <div class="controls flex flex-auto w-100">
            ${renderFullScreenButton()}
            <div class="infos overflow-hidden flex pr2">
              ${infos}
            </div>
            <div class="flex flex-auto justify-end">
              <div class="flex flex-auto w-100">
                ${renderSeeker()}
              </div>
              <div class="flex items-center">
                ${this.renderMenuButton({ orientation: 'topright' })}
                ${renderVolumeControl()}
                ${playPauseButton}
                ${nextButton}
              </div>
            </div>
          </div>
        `
      }
    }[this.machine.state.fullscreen]()

    return controls
  }

  renderMenuButton (options = {}) {
    const { orientation = 'top' } = options

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
      orientation, // popup menu orientation
      style: 'blank',
      caret: true,
      iconName: 'dropdown' // button icon
    })

    return html`
      <div class="menu_button flex items-center relative">
        ${menuButton}
      </div>
    `
  }

  beforerender () {
    this.resizeObserver = new Ro((entries, observer) => {
      nanobounce(() => {
        morph(this.element.querySelector('.player-component'), this.renderPlayer())
      })
    })

    this.resizeObserver.observe(document.body)
  }

  load (el) {
    if ('mediaSession' in navigator) {
      navigator.mediaSession.setActionHandler('previoustrack', () => {
        this.playback.emit('previous')
      })
      navigator.mediaSession.setActionHandler('nexttrack', () => {
        this.playback.emit('next')
      })
      navigator.mediaSession.setActionHandler('play', () => {
        this.playback.emit('play')
      })
      navigator.mediaSession.setActionHandler('pause', () => {
        this.playback.emit('pause')
      })
    }

    log.info('Player element loaded')
  }

  _update () {
    log.info('Mutating player component')
    morph(this.element.querySelector('.player-component'), this.renderPlayer())
  }

  unload () {
    this.playback.emit('stop')
    this.resizeObserver.unobserve(document.body)
  }

  /*
   * Update player only once
   */

  update (props) {
    if (!this.src) {
      log.info('Updating src')

      this._track = props.track || {}
      this._trackGroup = props.trackGroup || [{}]
      this._count = props.count
      this._fav = props.fav
      this._played = false
      this._playlist = props.playlist || []
      this._index = this._playlist.findIndex((item) => item.track.id === this._track.id)

      if (props.src && props.src !== this.src) {
        this.src = props.src
        this._played = false
        this.sound.load(this.setUrl(this.src))
      }

      morph(this.element.querySelector('.player-component'), this.renderPlayer())
    }
    return false
  }

  _handlePlayPause (e) {
    e.preventDefault()
    e.stopPropagation()

    const eventName = {
      idle: 'play',
      playing: 'pause',
      paused: 'play',
      stopped: 'play'
    }[this.playback.state]

    if (!eventName) return false

    log.info(eventName)

    this.playback.emit(eventName)
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

  _toggleFullscreen () {
    log.info('fullscreen:toggle')
    morph(this.element.querySelector('.player-component'), this.renderPlayer())
  }

  _play () {
    log.info('Playing')

    const src = this.setUrl(this._src)

    if (this.sound.state.src !== src) {
      this._played = false
      this.sound.load(src)
    }

    this.sound.play()

    this._index = this._playlist.findIndex((item) => item.track.id === this._track.id)

    if ('mediaSession' in navigator) {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: this._track.title,
        artist: this._trackGroup[0].display_artist,
        album: this._trackGroup[0].title,
        artwork: [
          { src: this._track.cover, sizes: '600x600', type: 'image/png' }
        ]
      })
    }

    this._update()
  }

  _pause () {
    log.info('Paused')

    this.sound.pause()

    const playing = this.playback.state === 'playing'

    if (this.element) {
      const b = this.element.querySelector('.play-button')
      const i = this.element.querySelector('.icon-pause')
      b.setAttribute('title', playing ? 'Pause' : 'Play')
      morph(i, icon(playing ? 'pause' : 'play', { class: i.classList }))
    }
  }

  _stop (src) {
    log.info('Paused')

    this.sound.stop()

    if (this.element) {
      const b = this.element.querySelector('.play-button')
      const i = this.element.querySelector('.icon-pause')
      b.setAttribute('title', 'Play')
      morph(i, icon('play', { class: i.classList }))
    }
  }

  _previous () {
    if (isNaN(this._index)) return false
    if (this._index === -1) return false
    const index = this._index - 1
    const prev = this._playlist[index]

    if (prev) {
      log.info('Previous', prev)

      this._index = index
      this.src = prev.url
      this._track = prev.track
      this._trackGroup = prev.track_group
      this._count = prev.count
      this._fav = prev.fav

      this.playback.emit('play')

      this.emit('player:previous', {
        track: prev
      })
    }
  }

  _next () {
    if (isNaN(this._index)) return false
    if (this._index === -1) return false

    const index = this._index + 1
    const next = this._playlist[index]

    if (next) {
      log.info('Next', next)

      this._index = index
      this.src = next.url
      this._track = next.track
      this._trackGroup = next.track_group
      this._count = next.count
      this._fav = next.fav

      this.playback.emit('play')

      this.emit('player:next', {
        track: next
      })
    } else {
      this.playback.emit('stop')
    }
  }

  _ended () {
    this.playback.emit('next')
  }

  _timeupdate (currentTime) {
    this._currentTime = currentTime
    this._progress = 100 * currentTime / this.sound.audio.duration

    if (this.seeker) {
      this.seeker.progress = this._progress

      if (this.seeker.slider) {
        this.seeker.slider.update({
          value: this._progress
        })
      }
    }

    /**
     * Once listener reach 45 seconds play time
     * we should save a play (paid or free)
     */

    if (this._currentTime >= 45 && !this._played) {
      this._played = true

      this.emit('player:cap', this._track)
    }

    if (this.element) {
      const el = this.element.querySelector('.currentTime')
      if (el) {
        morph(
          el,
          this.renderTime(this._currentTime)
        )
      }
    }
  }

  _loadedmetadata () {
    this.duration = this.sound.audio.duration

    morph(this.element.querySelector('.duration'), this.renderTime(this.duration, { class: 'duration' }))
  }

  set fav (fav) {
    this._fav = fav
  }

  get fav () {
    return this._fav
  }

  set trackGroup (trackGroup) {
    this._trackGroup = trackGroup
  }

  get trackGroup () {
    return this._trackGroup
  }

  set count (count) {
    this._count = count
  }

  get count () {
    return this._count
  }

  get track () {
    return this._track
  }

  set track (track) {
    this._track = track
  }

  get src () {
    return this._src
  }

  set src (src) {
    this._src = src
  }

  get playlist () {
    return this._playlist
  }

  set playlist (playlist) {
    this._playlist = playlist
  }

  get index () {
    return this._index
  }

  set index (index) {
    this._index = index
  }
}

module.exports = Player
