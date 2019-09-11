/**
 * Utils
 */
const promiseHash = require('promise-hash/lib/promise-hash')
const setTitle = require('../lib/title')

const storage = require('localforage')
storage.config({
  name: 'resonate',
  version: 1.0,
  size: 4980736, // Size of database, in bytes. WebSQL-only for now.
  storeName: 'app', // Should be alphanumeric, with underscores.
  description: 'Resonate storage'
})
const generateApi = require('../lib/api')
const adapter = require('@resonate/schemas/adapters/v1/track')

/**
 * Logging
 */

const logger = require('nanologger')
const log = logger('stream2own')

const Playlist = require('@resonate/playlist-component')

function app () {
  return (state, emitter) => {
    Object.assign(state, {
      title: 'Resonate',
      resolved: false,
      app: {
        onlineStatus: 'ONLINE'
      },
      api: generateApi(),
      user: {},
      tracks: [],
      albums: [],
      notification: {
        permission: false
      },
      messages: []
    }) // initialize state

    function setMeta () {
      const title = {
        '/': 'Dashboard',
        'search/:q': state.params.q ? state.params.q + ' • ' + 'Search' : 'Search',
        ':user/library/:type': {
          favorites: 'Favorites',
          owned: 'Owned',
          history: 'History'
        }[state.params.type],
        'playlist/:type': {
          'top-fav': 'Top favorites',
          latest: 'New',
          random: 'Random',
          top: 'Top 50',
          'staff-picks': 'Staff Picks'
        }[state.params.type]
      }[state.route]

      if (!title) return

      state.shortTitle = title

      const fullTitle = setTitle(title)

      emitter.emit('meta', {
        title: fullTitle,
        'twitter:card': 'summary_large_image',
        'twitter:title': fullTitle,
        'twitter:site': '@resonatecoop'
      })
    }

    emitter.on('route:/', async () => {
      try {
        const response = await state.api.tracklists.get({ type: 'random' })

        if (response.data) {
          state.tracks = response.data.map(adapter)
          emitter.emit(state.events.RENDER)
        }
      } catch (err) {
        log.error(err)
      }
    })

    emitter.on('route:library/:type', () => {
      if (!state.api.token) {
        state.redirect = `/library/${state.params.type}`
        log.info(`Redirecting to ${state.redirect}`)
        return emitter.emit(state.events.PUSHSTATE, '/login')
      }
      const scope = `/${state.user.username}`
      emitter.emit(state.events.PUSHSTATE, scope + `/library/${state.params.type}`)
    })

    emitter.on('route::user/library/:type', async () => {
      if (!state.api.token) {
        state.redirect = state.href
        log.info(`Redirecting to ${state.redirect}`)
        return emitter.emit(state.events.PUSHSTATE, '/login')
      }

      state.tracks = []
      emitter.emit(state.events.RENDER)

      const id = `playlist-${state.params.type}`
      const { machine, events } = state.components[id] || state.cache(Playlist, id).local

      const startLoader = () => {
        events.emit('loader:on')
      }
      const loaderTimeout = setTimeout(startLoader, 300)
      try {
        const user = await storage.getItem('user')
        const pageNumber = state.query.page ? Number(state.query.page) : 1

        machine.emit('start')

        const request = state.api.users.tracks[state.params.type]

        if (typeof request !== 'function') return

        const response = await request({ uid: user.uid, limit: 50, page: pageNumber - 1 })

        events.state.loader === 'on' && events.emit('loader:off')

        if (response.data) {
          machine.emit('resolve')
          state.tracks = response.data.map(adapter)
          state.numberOfPages = response.numberOfPages
        } else {
          machine.emit('notFound')
        }

        emitter.emit(state.events.RENDER)
      } catch (err) {
        console.log(err)
        machine.emit('reject')
        log.error(err)
      } finally {
        clearTimeout(loaderTimeout)
      }
    })

    emitter.on('route:playlist/:type', async () => {
      state.tracks = []

      emitter.emit(state.events.RENDER)

      const { machine, events } = state.components[`playlist-${state.params.type}`] || state.cache(Playlist, `playlist-${state.params.type}`).local

      const startLoader = () => {
        events.emit('loader:on')
      }
      const loaderTimeout = setTimeout(startLoader, 300)

      machine.emit('start')

      const pageNumber = state.query.page ? Number(state.query.page) : 1

      try {
        const response = await state.api.tracklists.get({
          type: state.params.type,
          limit: 50,
          page: pageNumber - 1
        })

        machine.emit('resolve')
        events.state.loader === 'on' && events.emit('loader:off')

        if (response.data) {
          state.tracks = response.data.map(adapter)
          state.numberOfPages = response.numberOfPages || 1
        }

        emitter.emit(state.events.RENDER)
      } catch (err) {
        machine.emit('reject')
        log.error(err)
      } finally {
        clearTimeout(loaderTimeout)
      }
    })

    emitter.on('route:login', async () => {
      if (state.api.token) {
        log.info('Redirecting to /')
        emitter.emit(state.events.PUSHSTATE, '/')
      }
    })

    emitter.on(state.events.VISIBILITYCHANGE, (vis) => {
      if (vis === 'VISIBLE') {
        emitter.emit('users:auth', false)
      }
    })

    emitter.on('users:auth', async (reload = true) => {
      try {
        const { user, clientId } = await promiseHash({
          user: storage.getItem('user'),
          clientId: storage.getItem('clientId')
        })

        if (user && clientId) {
          state.api = generateApi({ clientId, user })
          state.user = Object.assign(state.user, user)

          emitter.emit(state.events.RENDER)

          const response = await state.api.auth.tokens({ uid: user.uid })

          if (response.status !== 401) {
            const { accessToken: token, clientId } = response
            state.api = generateApi({ token, clientId, user: state.api.user })
          } else {
            emitter.emit('logout')
          }
        } else {
          state.api = generateApi()
        }
      } catch (err) {
        log.error(err)
      } finally {
        if (reload) emitter.emit('api:ok')
        emitter.emit(state.events.RENDER)
      }
    })

    emitter.on('logout', (redirect = false) => {
      state.user = {}
      state.api = generateApi()
      storage.clear() // clear everything in indexed db
      if (redirect) {
        emitter.emit(state.events.PUSHSTATE, '/login')
      }
    })

    emitter.on(state.events.DOMCONTENTLOADED, () => {
      setMeta()

      document.body.removeAttribute('unresolved') // this attribute was set to prevent fouc on chrome

      emitter.on(state.events.OFFLINE, () => {
        emitter.emit('notify', { message: 'Your browser is offline' })
      })

      emitter.on(state.events.RESIZE, () => {
        emitter.emit(state.events.RENDER)
      })

      emitter.emit('users:auth')

      emitter.on('api:ok', () => {
        state.resolved = true
        emitter.emit(state.events.RENDER)
        log.info('api ok')
        emitter.emit(`route:${state.route}`)
      })
    })

    emitter.on(state.events.NAVIGATE, () => {
      setMeta()
      emitter.emit(`route:${state.route}`)
      window.scrollTo(0, 0)
    })

    emitter.on('credits:set', async (credits) => {
      const user = await storage.getItem('user')
      user.credits = credits
      state.user = user
      await storage.setItem('user', user)
      emitter.emit('notify', { timeout: 3000, message: 'You credits have been topped up' })
      emitter.emit(state.events.RENDER)
    })

    emitter.on('storage:clear', () => {
      storage.clear()
      const timeout = 3000
      emitter.emit('notify', { timeout, message: 'Cache cleared. Reloading...' })
      setTimeout(() => {
        window.location.reload()
      }, timeout)
    })
  }
}

module.exports = app
