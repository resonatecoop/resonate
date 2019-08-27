/**
 * Utils
 */
const promiseHash = require('promise-hash/lib/promise-hash')

/**
 * Logging
 */

const logger = require('nanologger')
const log = logger('player')

const generateApi = require('../lib/api')
const adapter = require('@resonate/schemas/adapters/v1/track')

const Dialog = require('../components/dialog')
const LoginForm = require('../components/forms/login')
const html = require('choo/html')

/**
 * Configure localforage
 */

const storage = require('localforage')

storage.config({
  name: 'resonate',
  version: 1.0,
  size: 4980736, // Size of database, in bytes. WebSQL-only for now.
  storeName: 'app', // Should be alphanumeric, with underscores.
  description: 'Resonate storage'
})

/**
 * Main application store
 * @param {object} state Choo state
 * @param {object} emitter Nanobus instance
 */
const app = (state, emitter) => {
  state.tracks = state.tracks || []
  state.track = state.track || {}
  state.albums = state.albums || []
  state.api = generateApi()

  emitter.on('route:embed/artists/:uid/tracks', async () => {
    const uid = parseInt(state.params.uid, 10)

    try {
      const response = await state.api.artists.getTracks({ uid })
      if (response.data) {
        state.tracks = response.data.map(adapter)
        if (!state.track.id) state.track = state.tracks[0]
        emitter.emit(state.events.RENDER)
      }
    } catch (err) {
      log.error(err)
    }
  })

  emitter.on('route:embed/tracks', async () => {
    try {
      const response = await state.api.tracklists.get()
      if (response.data) {
        state.tracks = response.data.map(adapter)
        if (!state.track.id) state.track = state.tracks[0]
        emitter.emit(state.events.RENDER)
      }
    } catch (err) {
      log.error(err)
    }
  })

  emitter.on('route:embed/playlists/:pid/tracks', async () => {
    const pid = parseInt(state.params.pid, 10)

    try {
      const response = await state.api.playlists.get({ pid })

      if (response.data) {
        if (!state.track.id) state.track = state.tracks[0]
        emitter.emit(state.events.RENDER)
      }
    } catch (err) {
      log.error(err)
    }
  })

  emitter.on('route:embed/labels/:uid/albums', async () => {
    const uid = parseInt(state.params.uid, 10)

    try {
      const response = await state.api.labels.getAlbums({ uid })

      if (response.data) {
        state.albums = response.data
        state.tracks = state.albums[0].tracks.map(adapter)
        if (!state.track.id) state.track = state.tracks[0]
        emitter.emit(state.events.RENDER)
      }
    } catch (err) {
      log.error(err)
    }
  })

  emitter.on('route:embed/artists/:uid/albums', async () => {
    const uid = parseInt(state.params.uid, 10)

    try {
      const response = await state.api.artists.getAlbums({ uid })
      if (response.data) {
        state.albums = response.data
        state.tracks = state.albums[0].tracks.map(adapter)
        if (!state.track.id) state.track = state.tracks[0]
        emitter.emit(state.events.RENDER)
      }
    } catch (err) {
      log.error(err)
    }
  })

  emitter.on('route:embed/tracks/:tid', async () => {
    try {
      const tid = parseInt(state.params.tid, 10)
      const response = await state.api.tracks.findOne({ tid })
      if (response.data) {
        state.track = adapter(response.data)
        emitter.emit(state.events.RENDER)
      }
    } catch (err) {
      log.error(err)
    }
  })

  emitter.on('route:embed', async () => {
    try {
      const response = await state.api.tracklists.get()
      if (response.data) {
        state.tracks = response.data.map(adapter)
        if (!state.track.id) state.track = state.tracks[0]
        emitter.emit(state.events.RENDER)
      }
    } catch (err) {
      log.error(err)
    }
  })

  emitter.on('route:*', () => {
    // do something about 404
  })

  emitter.on('login:success', async (props) => {
    const { token, clientId, user } = props

    await Promise.all([
      storage.setItem('user', user),
      storage.setItem('clientId', clientId)
    ])

    state.api = generateApi({ token, clientId, user })
  })

  emitter.on('users:auth', async () => {
    try {
      const { user, clientId } = await promiseHash({
        user: storage.getItem('user'),
        clientId: storage.getItem('clientId')
      })

      if (user && clientId) {
        state.api = generateApi({ clientId, user })

        const response = await state.api.auth.tokens({ uid: user.uid })

        if (response) {
          const { accessToken: token, clientId } = response
          state.api = generateApi({ token, clientId, user: state.api.user })
        }
      }
    } catch (err) {
      log.error(err)
    }
  })

  emitter.on(state.events.DOMCONTENTLOADED, () => {
    const frameEl = window.frameElement
    if (frameEl) {
      const theme = frameEl.getAttribute('theme')
      emitter.emit('theme', { theme })
    }

    document.body.removeAttribute('unresolved') // this attribute was set to prevent fouc on chrome

    if (state.route === '/') {
      emitter.emit(state.events.REPLACESTATE, '/embed')
    } else {
      emitter.emit(`route:${state.route}`)
    }

    emitter.emit('users:auth')
  })

  emitter.on('login', () => {
    const dialogEl = state.cache(Dialog, 'dialog-login').render({
      title: 'Please login',
      classList: 'dialog-default dialog--sm',
      content: function () {
        return html`
          <div class="content">
            ${state.cache(LoginForm, 'login').render()}
          </div>
        `
      }
    })

    document.body.appendChild(dialogEl)
  })

  emitter.on('favorite', async (props) => {
    const { track, trackGroup } = props
    const artist = trackGroup[0].display_artist

    try {
      const response = await state.api.tracks.favorites.toggle({
        uid: 2124,
        tid: track.id,
        type: 1
      })

      if (response.status === 401) return emitter.emit('login')

      emitter.emit('notify', {
        message: `${track.title} by ${artist} was added to your favorite tracks`
      })
    } catch (err) {
      log.error(err)
    }
  })

  emitter.on('unfavorite', async (props) => {
    const { track, trackGroup } = props
    const artist = trackGroup[0].display_artist

    try {
      const response = await state.api.tracks.favorites.toggle({
        uid: 2124,
        tid: track.id,
        type: 0
      })

      if (response.status === 401) return emitter.emit('login')

      emitter.emit('notify', {
        message: `'${track.title}' by ${artist} was removed from your favorite tracks`
      })
    } catch (err) {
      log.error(err)
    }
  })

  emitter.on('player:cap', async (props) => {
    const { track, trackGroup } = props
    const artist = trackGroup[0].display_artist

    log.info('Played')

    try {
      const response = await state.api.plays.add({
        uid: state.api.user.uid,
        tid: track.id
      })

      if (response.status === 401) return emitter.emit('login')

      log.info(`Saved play for ${track.title} by ${artist}`)

      emitter.emit('notify', { message: `Played ${track.title} by ${artist}` })
    } catch (err) {
      log.error(err)
    }
  })

  emitter.on('player:error', ({ message }) => {
    emitter.emit('notify', { message })
  })

  emitter.on(state.events.NAVIGATE, () => {
    emitter.emit(`route:${state.route}`)
    window.scrollTo(0, 0)
  })
}

module.exports = app
