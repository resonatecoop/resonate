const setTitle = require('../lib/title')

function app () {
  return (state, emitter) => {
    emitter.on(state.events.DOMCONTENTLOADED, () => {
      setMeta()
      emitter.emit(`route:${state.route}`)
    })

    emitter.on(state.events.NAVIGATE, () => {
      setMeta()
      emitter.emit(`route:${state.route}`)
    })

    function setMeta () {
      const title = {
        '/': 'Upload release',
        'releases': 'Releases'
      }[state.route]

      if (!title) return

      state.shortTitle = title

      const fullTitle = setTitle(title)

      emitter.emit('meta', {
        'title': fullTitle,
        'twitter:card': 'summary_large_image',
        'twitter:title': fullTitle,
        'twitter:site': '@resonatecoop'
      })
    }
  }
}

module.exports = app
