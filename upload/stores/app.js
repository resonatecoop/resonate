const setTitle = require('../lib/title')
const generateApi = require('../lib/api')

function app () {
  return (state, emitter) => {
    state.api = generateApi()
    state.user = state.user || {
      resolved: false,
      data: {}
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
        releases: 'Releases'
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
  }
}

module.exports = app
