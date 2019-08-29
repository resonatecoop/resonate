const setTitle = require('../lib/title')
const generateApi = require('../lib/api')
const storage = require('localforage')

storage.config({
  name: 'resonate',
  version: 1.0,
  size: 4980736, // Size of database, in bytes. WebSQL-only for now.
  storeName: 'app', // Should be alphanumeric, with underscores.
  description: 'Resonate storage'
})

function app () {
  return (state, emitter) => {
    state.api = generateApi()
    state.user = state.user || {
      resolved: false,
      data: {}
    }
    state.data = state.data || {
      type: 'lp'
    }

    emitter.on(state.events.DOMCONTENTLOADED, () => {
      setMeta()
      emitter.emit('load:user')
      emitter.emit(`route:${state.route}`)
    })

    emitter.on('load:user', async () => {
      try {
        const response = await state.api.user()

        if (state.user.data) {
          state.user.data = response

          await storage.setItem('user', state.user)
        }

        state.data = await storage.getItem('release')

        if (!state.data) {
          await storage.setItem('release', Object.assign({}, state.data, { display_artist: state.user.data.display_name }))
        }

        state.user.resolved = true

        emitter.emit(state.events.RENDER)
      } catch (err) {
        console.log(err)
      }
    })

    emitter.on(state.events.NAVIGATE, () => {
      setMeta()
      emitter.emit(`route:${state.route}`)
    })

    function setMeta () {
      const title = {
        '/': 'Upload release',
        tracks: 'Tracks',
        artworks: 'Artworks',
        releases: 'Releases',
        'releases/:id': 'Release',
        'releases/:id/tracks': 'Add tracks'
      }[state.route]

      if (!title) return

      const fullTitle = setTitle(title)

      emitter.emit('meta', {
        title: fullTitle,
        'twitter:card': 'summary_large_image',
        'twitter:title': fullTitle,
        'twitter:site': '@resonatecoop'
      })
    }
  }
}

module.exports = app
