const promiseHash = require('promise-hash/lib/promise-hash')
const setTitle = require('../lib/title')
const isUrl = require('validator/lib/isURL')
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
        '/': 'Stream2own',
        login: 'Login',
        'search/:q': state.params.q ? state.params.q + ' • ' + 'Search' : 'Search',
        account: 'Account',
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

    emitter.on('route:library/:type', () => {
      if (!state.user.uid) {
        state.redirect = `/library/${state.params.type}`
        return emitter.emit('redirect', { dest: '/login', message: 'You are not logged in…' })
      }
      const scope = `/${state.user.username}`
      emitter.emit(state.events.PUSHSTATE, scope + `/library/${state.params.type}`)
    })

    emitter.on('tracks:clear', () => {
      state.tracks = []
      emitter.emit(state.events.RENDER)
    })

    emitter.on('route::user/library/:type', async (clear = true) => {
      if (!state.user.uid) {
        state.redirect = state.href
        return emitter.emit('redirect', { dest: '/login', message: 'You are not logged in…' })
      }

      state.cache(Playlist, `playlist-${state.params.type}`)

      if (clear) emitter.emit('tracks:clear')

      const { machine, events } = state.components[`playlist-${state.params.type}`]
      const loaderTimeout = setTimeout(() => {
        events.emit('loader:on')
      }, 300)

      machine.emit('start')

      try {
        const pageNumber = state.query.page ? Number(state.query.page) : 1
        const request = state.api.users.tracks[state.params.type]

        if (typeof request !== 'function') {
          return emitter.emit(state.events.PUSHSTATE, '/')
        }

        const response = await request({
          uid: state.user.uid,
          limit: 50,
          page: pageNumber - 1
        })

        if (events.state.loader === 'on') {
          events.emit('loader:off')
        }

        if (response.data) {
          machine.emit('resolve')
          state.tracks = response.data.map(adapter)
          state.numberOfPages = response.numberOfPages
        } else {
          machine.emit('404')
        }

        emitter.emit(state.events.RENDER)
      } catch (err) {
        machine.emit('reject')
        log.error(err)
      } finally {
        clearTimeout(loaderTimeout)
      }
    })

    emitter.on('refresh', () => {
      emitter.emit(`route:${state.route}`, false)
    })

    emitter.on('route:playlist/:type', async (clear = true) => {
      state.cache(Playlist, `playlist-${state.params.type}`)

      if (clear) emitter.emit('tracks:clear')

      const { machine, events } = state.components[`playlist-${state.params.type}`]

      const loaderTimeout = setTimeout(() => {
        events.emit('loader:on')
      }, 300)
      const pageNumber = state.query.page ? Number(state.query.page) : 1

      machine.emit('start')

      try {
        const response = await state.api.tracklists.get({
          type: state.params.type,
          limit: 50,
          page: pageNumber - 1
        })

        machine.emit('resolve')

        if (events.state.loader === 'on') {
          events.emit('loader:off')
        }

        if (response.data) {
          state.tracks = response.data.map(adapter)
          state.numberOfPages = response.numberOfPages || 1
        }
      } catch (err) {
        machine.emit('reject')
        log.error(err)
      } finally {
        clearTimeout(loaderTimeout)
        emitter.emit(state.events.RENDER)
      }
    })

    emitter.on('route:login', async () => {
      if (state.api.token || state.user.uid) {
        emitter.emit('redirect', { dest: '/', message: 'You are already logged in' })
      }
    })

    emitter.on('VISIBILITYCHANGE', (vis) => {
      if (vis === 'VISIBLE') {
        emitter.emit('users:auth', false)
        emitter.emit('update')
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

    emitter.on('logout', async (redirect = false) => {
      try {
        await state.api.auth.logout()
        state.api = generateApi()
        state.user = {}
        storage.clear() // clear everything in indexed db
        if (redirect) {
          emitter.emit('redirect', {
            dest: '/login',
            message: 'You are now logged out…'
          })
        }
      } catch (err) {
        emitter.emit('error', err)
      }
    })

    emitter.on(state.events.DOMCONTENTLOADED, () => {
      document.body.removeAttribute('unresolved') // this attribute was set to prevent fouc on chrome

      if (!navigator.onLine) {
        emitter.emit('notify', { message: 'Your browser is offline' })
      }

      setMeta()

      emitter.emit('update')

      emitter.on('OFFLINE', () => {
        emitter.emit('notify', { message: 'Your browser is offline' })
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

      const { machine } = state.components['player-footer']

      if (machine.state.fullscreen === 'on') {
        machine.emit('fullscreen:toggle')
      }

      window.scrollTo(0, 0)
    })

    emitter.on('credits:set', async (credits) => {
      const user = await storage.getItem('user')
      user.credits = credits
      state.user = user
      await storage.setItem('user', user)

      emitter.emit('notify', {
        timeout: 3000,
        message: 'You credits have been topped up'
      })

      emitter.emit(state.events.RENDER)
    })

    emitter.on('redirect', (props = {}) => {
      const {
        dest = '/',
        timeout = 3000,
        update = false,
        message = 'Redirecting...'
      } = props

      if (message) {
        emitter.emit('notify', { timeout, message })
      }

      if (isUrl(dest)) {
        return setTimeout(() => {
          window.location = dest
        }, timeout)
      }

      emitter.emit(state.events.PUSHSTATE, dest)

      if (update) {
        emitter.emit('update')
      }
    })

    emitter.on('storage:clear', (props = {}) => {
      const { timeout = 3000 } = props
      storage.clear()
      emitter.emit('notify', Object.assign({
        timeout: 3000,
        message: 'Cache cleared. Reloading...'
      }, props))
      setTimeout(() => {
        window.location.reload(true)
      }, timeout)
    })
  }
}

module.exports = app
