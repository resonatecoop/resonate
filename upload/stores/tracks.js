const Tracks = require('../components/tracks')

function tracks () {
  return (state, emitter) => {
    state.cache(Tracks, 'tracks')

    state.tracks = state.tracks || {
      items: []
    }

    emitter.on('route:tracks', async () => {
      const { loader, machine } = state.components['tracks']
      const startLoader = () => {
        loader.emit('loader:toggle')
      }

      const loaderTimeout = setTimeout(startLoader, 300)

      machine.emit('start')

      const pageNumber = state.query.page ? Number(state.query.page) : 1

      try {
        const { data, numberOfPages } = await state.api.tracks.find({ limit: 20, page: pageNumber - 1 })

        loader.emit('loader:toggle')
        machine.emit('resolve')

        state.tracks.items = data || []
        state.tracks.numberOfPages = numberOfPages

        emitter.emit(state.events.RENDER)
      } catch (err) {
        machine.emit('reject')
      } finally {
        clearTimeout(loaderTimeout)
      }
    })
  }
}

module.exports = tracks
