const Artworks = require('../components/artworks')

function artworks () {
  return (state, emitter) => {
    state.cache(Artworks, 'artworks')

    state.artworks = state.artworks || {
      items: []
    }

    emitter.on('route:artworks', async () => {
      const { loader, machine } = state.components['artworks']
      const startLoader = () => {
        loader.emit('loader:toggle')
      }

      const loaderTimeout = setTimeout(startLoader, 300)

      machine.emit('start')

      try {
        const response = await state.api.artworks.find()

        loader.emit('loader:toggle')
        machine.emit('resolve')

        state.artworks.items = response.data

        emitter.emit(state.events.RENDER)
      } catch (err) {
        machine.emit('reject')
      } finally {
        clearTimeout(loaderTimeout)
      }
    })
  }
}

module.exports = artworks
