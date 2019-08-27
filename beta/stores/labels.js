const promiseHash = require('promise-hash/lib/promise-hash')
const nanologger = require('nanologger')
const log = nanologger('store:labels')
const adapter = require('@resonate/schemas/adapters/v1/track')
const setTitle = require('../lib/title')
const Labels = require('../components/labels')

module.exports = labels

/*
 * @description Store for labels
 */

function labels () {
  return (state, emitter) => {
    state.label = state.label || {
      data: {},
      artists: {
        items: [],
        numberOfPages: 1
      },
      albums: {
        items: [],
        numberOfPages: 1
      },
      tracks: []
    }

    state.labels = state.labels || {
      items: [],
      numberOfPages: 1
    }

    state.cache(Labels, 'labels')

    emitter.on('labels:meta', setMeta)
    emitter.on('route:labels', getLabels)
    emitter.on('route:labels/:uid', getLabel)
    emitter.on('route:labels/:uid/albums', getLabelAlbums)
    emitter.on('route:labels/:uid/artists', getLabelArtists)

    function setMeta () {
      const { name = '', avatar = {} } = state.label.data
      const title = {
        labels: 'Labels',
        'labels/:uid': name,
        'labels/:uid/albums': name,
        'labels/:uid/artists': name
      }[state.route]

      if (!title) return

      state.shortTitle = title

      const fullTitle = setTitle(title)

      const image = {
        'labels/:uid': avatar.original || ''
      }[state.route]

      emitter.emit('meta', {
        title: fullTitle,
        'og:image': image,
        'twitter:card': 'summary_large_image',
        'twitter:title': fullTitle,
        'twitter:image': image,
        'twitter:site': '@resonatecoop'
      })
    }

    async function getLabels () {
      emitter.emit('labels:meta')

      const { loader, machine } = state.components.labels

      const startLoader = () => {
        loader.emit('loader:toggle')
      }

      const loaderTimeout = setTimeout(startLoader, 300)

      try {
        const pageNumber = state.query.page ? Number(state.query.page) : 1

        machine.emit('start')

        const response = await state.api.labels.find({ page: pageNumber - 1, limit: 20 })

        loader.emit('loader:toggle')
        machine.emit('resolve')

        if (response.data) {
          state.labels.items = response.data
          state.labels.numberOfPages = response.numberOfPages
        }

        emitter.emit(state.events.RENDER)
      } catch (err) {
        machine.emit('reject')
        log.error(err)
      } finally {
        clearTimeout(loaderTimeout)
      }
    }

    async function getLabel () {
      try {
        const uid = parseInt(state.params.uid, 10)
        const isNew = state.label.data.id !== uid

        if (isNew) {
          state.label = {
            data: {},
            topTracks: [],
            artists: {
              items: [],
              numberOfPages: 1
            },
            albums: {
              items: [],
              numberOfPages: 1
            },
            tracks: []
          }

          emitter.emit(state.events.RENDER)
        } else {
          emitter.emit('labels:meta')
        }

        const { albums, artists, label } = await promiseHash({
          albums: state.api.labels.getAlbums({ uid, limit: 5 }),
          artists: state.api.labels.getArtists({ uid, limit: 20 }),
          label: state.api.labels.findOne({ uid })
        })

        state.label.data = label.data

        state.label.artists.items = artists.data || []
        state.label.artists.numberOfPages = artists.numberOfPages || 1

        state.label.albums.items = albums.data || []
        state.label.albums.numberOfPages = albums.numberOfPages || 1

        if (!state.tracks.length && albums.data.length) {
          state.tracks = albums.data[0].tracks.map(adapter)
        }

        emitter.emit('labels:meta')

        emitter.emit(state.events.RENDER)
      } catch (err) {
        log.error(err)
      }
    }

    async function getLabelAlbums () {
      const uid = parseInt(state.params.uid, 10)
      const isNew = state.artist.data.id !== uid

      if (isNew) {
        state.label = {
          data: {},
          topTracks: [],
          artists: {
            items: [],
            numberOfPages: 1
          },
          albums: {
            items: [],
            numberOfPages: 1
          },
          tracks: []
        }

        emitter.emit(state.events.RENDER)
      } else {
        emitter.emit('labels:meta')
      }

      const pageNumber = state.query.page ? Number(state.query.page) : 1

      try {
        const { label, albums } = await promiseHash({
          albums: state.api.labels.getAlbums({ uid, limit: 5, page: pageNumber - 1 }),
          label: state.api.labels.findOne({ uid })
        })

        state.label.data = label.data || {}
        state.label.albums.items = albums.data || []
        state.label.albums.numberOfPages = albums.numberOfPages || 1

        emitter.emit('labels:meta')

        emitter.emit(state.events.RENDER)
      } catch (err) {
        log.error(err)
      }
    }

    async function getLabelArtists () {
      const uid = parseInt(state.params.uid, 10)
      const isNew = state.artist.data.id !== uid

      if (isNew) {
        state.label = {
          data: {},
          artists: {
            items: [],
            numberOfPages: 1
          },
          albums: {
            items: [],
            numberOfPages: 1
          },
          tracks: []
        }

        emitter.emit(state.events.RENDER)
      } else {
        emitter.emit('labels:meta')
      }

      const pageNumber = state.query.page ? Number(state.query.page) : 1

      try {
        const { label, artists } = await promiseHash({
          artists: state.api.labels.getArtists({ uid, limit: 20, page: pageNumber - 1 }),
          label: state.api.labels.findOne({ uid })
        })

        state.label.data = label.data || {}
        state.label.artists.items = artists.data || []
        state.label.artists.numberOfPages = artists.numberOfPages || 1

        emitter.emit('labels:meta')
        emitter.emit(state.events.RENDER)
      } catch (err) {
        log.error(err)
      }
    }
  }
}
