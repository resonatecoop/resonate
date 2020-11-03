/* global MediaMetadata, matchMedia */

const { isBrowser } = require('browser-or-node')
const assert = require('assert')
const html = require('nanohtml')
const Nanocomponent = require('nanocomponent')
const nanostate = require('nanostate')
const morph = require('nanomorph')
const renderCounter = require('@resonate/counter')
const button = require('@resonate/button')
const Artwork = require('@resonate/artwork-component')
const PlayCount = require('@resonate/play-count')
const NanoPlayer = require('@resonate/nanoplayer')
const MenuButton = require('@resonate/menu-button')
const Seeker = require('@resonate/seeker-component')
const VolumeControl = require('@resonate/volume-control-component')
const RoComponent = require('resize-observer-component')
const Ro = require('resize-observer-polyfill')
const Nanobounce = require('nanobounce')
const nanobounce = Nanobounce()
const clock = require('mm-ss')
const { borders: borderColors } = require('@resonate/theme-skins')
const menuOptions = require('@resonate/menu-button-options')

/*
 * Logging
 */

const logger = require('nanologger')
const log = logger('player')

const sound = isBrowser ? new NanoPlayer() : null

class Player extends Nanocomponent {
  constructor (id, state, emit) {
    super(id)

    this.state = state
    this.emit = emit

    this.local = state.components[id] = Object.create({
      playback: nanostate('idle', {
        idle: { play: 'playing' },
        playing: { pause: 'paused', stop: 'stopped' },
        paused: { play: 'playing', stop: 'stopped' },
        stopped: { play: 'playing' }
      }),
      machine: nanostate.parallel({
        fullscreen: nanostate('off', {
          on: { toggle: 'off' },
          off: { toggle: 'on' }
        })
      })
    })

    this._update = this._update.bind(this)

    this.local.volume = 1
    this.local.progress = 0
    this.local.currentTime = 0
    this.local.duration = 0

    this.local.playback.event('previous', nanostate('previous', {
      previous: { play: 'playing', stop: 'stopped' }
    }))

    this.local.playback.event('next', nanostate('next', {
      next: { play: 'playing', stop: 'stopped' }
    }))

    this.local.playback.on('playing', () => {
      log.info('Playing')

      const src = this.setUrl(this.local.src)

      const isNew = sound.state.src !== src

      if (isNew) {
        this.local.played = false
        sound.load(src)
      }

      sound.play()

      this._update(isNew)

      this.local.index = this.local.playlist.findIndex(item => item.track.id === this.local.track.id)

      if ('mediaSession' in navigator) {
        navigator.mediaSession.metadata = new MediaMetadata({
          title: this.local.track.title,
          artist: this.local.trackGroup[0].display_artist,
          album: this.local.trackGroup[0].title,
          artwork: [
            { src: this.local.track.cover, sizes: '600x600', type: 'image/png' }
          ]
        })
      }
    })

    this.local.playback.on('paused', () => {
      log.info('Paused')

      sound.pause()

      this._update()
    })

    this.local.playback.on('stopped', () => {
      log.info('Stopped')

      sound.stop()

      this.local.played = false

      this._update()
    })

    this.local.playback.on('previous', () => {
      if (isNaN(this.local.index)) return false
      if (this.local.index === -1) return false
      const index = this.local.index - 1
      const prev = this.local.playlist[index]

      if (prev) {
        log.info('Previous', prev)

        this.local.index = index
        this.local.src = prev.url
        this.local.track = prev.track
        this.local.trackGroup = prev.track_group
        this.local.count = prev.count

        this.local.playback.emit('play')

        this.emit('player:previous', {
          track: prev
        })
      }
    })

    this.local.playback.on('next', () => {
      if (isNaN(this.local.index)) return false
      if (this.local.index === -1) return false

      const index = this.local.index + 1
      const next = this.local.playlist[index]

      if (next) {
        log.info('Next', next)

        this.local.index = index
        this.local.src = next.url
        this.local.track = next.track
        this.local.trackGroup = next.track_group
        this.local.count = next.count

        this.local.playback.emit('play')

        this.emit('player:next', {
          track: next
        })
      } else {
        this.local.playback.emit('stop')
      }
    })

    this.local.machine.on('fullscreen:toggle', () => {
      log.info('fullscreen:toggle')
      this._update(true)
    })

    if (isBrowser) {
      if ('mediaSession' in navigator) {
        navigator.mediaSession.setActionHandler('previoustrack', () => {
          this.local.playback.emit('previous')
        })
        navigator.mediaSession.setActionHandler('nexttrack', () => {
          this.local.playback.emit('next')
        })
        navigator.mediaSession.setActionHandler('play', () => {
          this.local.playback.emit('play')
        })
        navigator.mediaSession.setActionHandler('pause', () => {
          this.local.playback.emit('pause')
        })
      }
    }

    if (sound !== null) {
      sound.on('loadedmetadata', () => {
        this.local.duration = sound.audio.duration

        if (this.element) {
          morph(this.element.querySelector('.duration'), renderTime(this.local.duration, { class: 'duration' }))
        }
      })

      sound.on('ended', () => {
        this.local.playback.emit('next')
      })

      sound.on('timeupdate', (currentTime) => {
        this.local.currentTime = currentTime
        this.local.progress = 100 * currentTime / sound.audio.duration

        const seeker = this.state.components['player-seeker']

        if (seeker) {
          seeker.progress = this.local.progress
        }

        if (this.element) {
          const seekerEl = this.element.querySelector('#seeker')

          if (seekerEl) {
            seekerEl.rangeSlider.update({
              value: this.local.progress
            })
          }
        }

        /**
         * Once listener reach 45 seconds play time
         * we should save a play (paid or free)
         */

        if (currentTime >= 45 && !this.local.played) {
          this.local.played = true

          this.emit('player:cap', this.local.track)
        }

        if (this.element) {
          morph(this.element.querySelector('.currentTime'), renderTime(currentTime))
        }
      })

      sound.on('error', (reason) => {
        this.emit('player:error', { reason })
      })
    }
  }

  playing () {
    return this.local.playback.state === 'playing'
  }

  setUrl (url) {
    return url
  }

  createElement (props) {
    assert.strictEqual(typeof props, 'object', 'props should be an object')

    this.setUrl = props.setUrl

    if (!this.local.track) {
      this.local.track = props.track || {}
      this.local.playlist = props.playlist || []
      this.local.trackGroup = props.trackGroup || [{}]
      this.local.count = props.count
      this.local.index = this.local.playlist.findIndex((item) => item.track.id === this.local.track.id)

      if (props.src !== null && props.src !== this.local.src) {
        this.local.src = props.src
        sound.load(this.setUrl(this.local.src))
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
    return html`
      <div class="player-component flex flex-column h-100">
        ${this.renderArtwork()}
        ${this.renderControls()}
      </div>
    `
  }

  renderControls () {
    const hasPlaylist = Array.isArray(this.local.playlist) && this.local.playlist.length

    const renderInfos = (props) => {
      const { title, artist, uid } = props

      return html`
        <div class="infos flex flex-auto flex-column justify-center">
          <div class="flex flex-column justify-end">
            <span class="track-title truncate f5">
              ${title}
            </span>
            <a href="/artists/${uid}" class="link no-underline flex color-inherit track-artist truncate f5 dark-gray mid-gray--dark dark-gray--light">
              ${artist}
            </a>
          </div>
        </div>
      `
    }

    const playPauseButton = button({
      style: 'blank',
      size: 'medium',
      prefix: 'play-button',
      onClick: () => {
        return this.local.playback.emit(this.playing() ? 'pause' : 'play')
      },
      title: this.playing() ? 'Pause' : 'Play',
      iconName: this.playing() ? 'pause' : 'play'
    })

    const prevButton = button({
      style: 'blank',
      size: 'medium',
      disabled: !hasPlaylist,
      onClick: (e) => this.local.playback.emit('previous'),
      title: 'Previous',
      iconName: 'previous'
    })

    const nextButton = button({
      style: 'blank',
      size: 'medium',
      disabled: !hasPlaylist,
      onClick: (e) => this.local.playback.emit('next'),
      title: 'Next',
      iconName: 'next'
    })

    const renderPlayCount = () => {
      const playCount = new PlayCount(this.local.count)
      if (isBrowser) {
        playCount.counter = renderCounter(`cid-${this.local.track.id}`)
      }
      return html`
        <div class="flex items-center mr2 ph2">
          ${playCount.counter}
        </div>
      `
    }

    const renderFullScreenButton = (props) => {
      const title = this.local.machine.state.fullscreen === 'on' ? 'Disable fullscreen' : 'Enable fullscreen'
      const imageUrl = this.local.track.cover ? this.local.track.cover.replace('600x600', '120x120') : '/assets/default.png'
      const handleClick = (e) => this.local.machine.emit('fullscreen:toggle')
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
        const seeker = new Seeker('player-seeker', this.state, this.emit)

        return html`
          <div class="seeker z-1 flex flex-auto flex-column relative bw bl br ${borderColors}">
            ${seeker.render({
              progress: this.local.progress,
              onSlide: (value, percent, position) => {
                this.local.progress = value
                sound.mute()
                sound.seek(percent)
              },
              onSlideEnd: (value, percent, position) => {
                this.local.progress = value
                sound.seek(percent)
                sound.unmute()
              }
            })}
            <div class="absolute w-100 h-100 flex items-center justify-center" style="z-index:-1;">
              <span class="pl2 flex flex-auto">${renderTime(this.local.currentTime)}</span>
              <span class="pr2 flex flex-auto justify-end">
                ${renderTime(this.duration, { class: 'duration' })}
              </span>
            </div>
          </div>
        `
      }
    }

    const renderVolumeControl = (options = {}) => {
      if (breakpoint('ns') || options.force) {
        this.volumeControl = new VolumeControl('volume-control', this.state, this.emit)

        return this.volumeControl.render({
          vertical: true,
          volume: this.local.volume,
          onSlide: (value, percent, position) => {
            sound.volume(percent)
          }
        })
      }
    }

    const renderMenuButton = (options) => {
      const { orientation = 'top', data, items: menuItems, open } = options
      const trackId = this.local.track.id

      const menuButton = new MenuButton(`player-menu-button-${trackId}`)

      return html`
        <div class="menu_button flex items-center relative">
          ${menuButton.render({
            hover: false, // disabled activation on mousehover
            items: menuItems,
            updateLastAction: (actionName) => {
              const callback = menuItems.find(item => item.actionName === actionName).updateLastAction
              return callback(data)
            },
            open: open,
            title: 'Menu',
            id: `menu-button-${trackId}`,
            orientation, // popup menu orientation
            size: 'medium',
            style: 'blank',
            iconName: 'dropdown' // button icon
          })}
        </div>
      `
    }

    return {
      on: () => {
        return html`
          <div class="controls flex flex-column flex-auto flex-column h-100 bt bw b--mid-gray b--near-black--dark">
            <div class="flex flex-auto">
              <div class="flex w-100 flex-auto ml2">
                ${renderVolumeControl({ force: true })}
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
                ${renderInfos({
                  title: this.local.track.title,
                  artist: this.local.trackGroup[0].display_artist,
                  uid: this.local.trackGroup[0].id
                })}
                ${renderMenuButton(
                  Object.assign({ id: this.local.track.id, data: this.local, orientation: 'topright' },
                  menuOptions(this.state, this.emit, this.local))
                )}
              </div>
            </div>
          </div>
        `
      },
      off: () => {
        return html`
          <div class="controls flex flex-auto w-100">
            ${renderFullScreenButton()}
            <div class="overflow-hidden flex pr2">
              ${renderInfos({
                title: this.local.track.title,
                artist: this.local.trackGroup[0].display_artist,
                uid: this.local.trackGroup[0].id
              })}
            </div>
            <div class="flex flex-auto justify-end">
              <div class="flex flex-auto w-100">
                ${renderSeeker()}
              </div>
              <div class="flex items-center">
                ${renderMenuButton(
                  Object.assign({ id: this.local.track.id, data: this.local, orientation: 'topright' },
                  menuOptions(this.state, this.emit, this.local))
                )}
                ${renderVolumeControl('volume-control')}
                ${playPauseButton}
                ${nextButton}
              </div>
            </div>
          </div>
        `
      }
    }[this.local.machine.state.fullscreen]()
  }

  renderArtwork () {
    return {
      on: () => {
        const image = new Artwork().render({
          url: this.local.track.cover,
          style: {
            width: 'auto',
            maxHeight: 'calc(100vh - (var(--height-3)*3) - 5rem)' /* minus both menu heights and footer player */
          },
          animate: true
        })

        const disableFullScreenButton = button({
          style: 'blank',
          prefix: 'absolute z-1 top-1 right-1',
          onClick: (e) => this.local.machine.emit('fullscreen:toggle'),
          title: 'Disable fullscreen',
          iconName: 'close'
        })

        return html`
          <div class="artwork-fullscreen w-100 h-100">
            ${disableFullScreenButton}
            <div class="player-artwork flex flex-auto justify-center items-start w-100 h-100 relative">
              ${image}
            </div>
          </div>
        `
      },
      off: () => {}
    }[this.local.machine.state.fullscreen]()
  }

  beforerender () {
    this.resizeObserver = new Ro((entries, observer) => {
      nanobounce(() => {
        if (this.local.machine.state.fullscreen === 'off') {
          this._update(true)
        }
      })
    })

    this.resizeObserver.observe(document.body)
  }

  load (el) {
    log.info('Player element loaded')
  }

  unload () {
    this.resizeObserver.unobserve(document.body)
  }

  _update (force = false) {
    if (!this.element) return

    if (force === true) {
      return morph(this.element.querySelector('.player-component'), this.renderPlayer())
    }

    const b = this.element.querySelector('.play-button')
    const playing = this.playing()

    morph(b, button({
      style: 'blank',
      size: 'medium',
      prefix: 'play-button',
      onClick: () => {
        return this.local.playback.emit(this.playing() ? 'pause' : 'play')
      },
      title: playing ? 'Pause' : 'Play',
      iconName: playing ? 'pause' : 'play'
    }))
  }

  update (props) {
    if (!this.local.src) {
      log.info('Updating src')

      this.local.track = props.track || {}
      this.local.trackGroup = props.trackGroup || [{}]
      this.local.count = props.count
      this.local.played = false
      this.local.playlist = props.playlist || []
      this.local.index = this.local.playlist.findIndex((item) => item.track.id === this.local.track.id)

      if (props.src && props.src !== this.local.src) {
        this.local.src = props.src
        this.local.played = false
        sound.load(this.setUrl(this.local.src))
      }

      this._update(true)
    }

    return false
  }
}

module.exports = Player

function renderTime (t = 0, opts = {}) {
  return html`
    <div class=${opts.class || 'currentTime'}>${t > 0 ? clock(t) : ''}</div>
  `
}

function breakpoint (size) {
  if (!isBrowser) return true

  const breakpoint = {
    ns: 'screen and (min-width: 30em)',
    m: 'screen and (min-width: 30em) and (max-width: 60em)',
    lg: 'screen and (min-width: 60em)'
  }[size]

  return matchMedia(breakpoint).matches
}
