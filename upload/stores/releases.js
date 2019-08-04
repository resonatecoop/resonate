const Releases = require('../components/releases')

function releases () {
  return (state, emitter) => {
    state.cache(Releases, 'releases')

    state.releases = state.releases || {
      items: []
    }

    state.release = state.release || {
      data: {}
    }

    emitter.on('route:releases/:id/update', async () => {
      if (state.release.data.id !== state.params.id) {
        state.release.data = {}
        emitter.emit(state.events.RENDER)
      }
      try {
        const response = await state.api.releases.findOne({
          id: state.params.id
        })

        state.release.data = response.data

        emitter.emit(state.events.RENDER)
      } catch (err) {
        console.log(err)
      }
    })

    emitter.on('route:releases/:id/tracks', async () => {
      if (state.release.data.id !== state.params.id) {
        state.release.data = {}
        emitter.emit(state.events.RENDER)
      }
      try {
        const response = await state.api.releases.findOne({
          id: state.params.id
        })

        state.release.data = response.data

        emitter.emit(state.events.RENDER)
      } catch (err) {
        console.log(err)
      }
    })

    emitter.on('route:releases/:id', async () => {
      if (state.release.data.id !== state.params.id) {
        state.release.data = {}
        emitter.emit(state.events.RENDER)
      }
      try {
        const response = await state.api.releases.findOne({
          id: state.params.id
        })

        state.release.data = response.data

        emitter.emit(state.events.RENDER)
      } catch (err) {
        console.log(err)
      }
    })

    emitter.on('route:releases', async () => {
      const { loader, machine } = state.components['releases']
      const startLoader = () => {
        loader.emit('loader:toggle')
      }

      const loaderTimeout = setTimeout(startLoader, 300)

      machine.emit('start')

      try {
        const response = await state.api.releases.find()

        loader.emit('loader:toggle')
        machine.emit('resolve')

        state.releases.items = response.data

        emitter.emit(state.events.RENDER)
      } catch (err) {
        machine.emit('reject')
      } finally {
        clearTimeout(loaderTimeout)
      }
    })
  }
}

module.exports = releases
