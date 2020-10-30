const promiseHash = require('promise-hash/lib/promise-hash')
const nanologger = require('nanologger')
const log = nanologger('store:labels')
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

    emitter.once('prefetch:labels', () => {
      if (!state.prefetch) return

      emitter.emit('labels:meta')

      state.labels = state.labels || {
        items: [],
        numberOfPages: 1
      }

      const pageNumber = state.query.page ? Number(state.query.page) : 1
      const request = state.api.labels.find({
        page: pageNumber - 1,
        limit: 20
      }).then(response => {
        if (response.data) {
          state.labels.items = response.data
          state.labels.numberOfPages = response.numberOfPages
        }

        emitter.emit(state.events.RENDER)
      })

      state.prefetch.push(request)
    })

    emitter.once('prefetch:label', (id) => {
      if (!state.prefetch) return
      if (!id) return

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

      const request = state.api.labels.findOne({ uid: id }).then(response => {
        if (response.data) {
          state.label.data = response.data
        }

        emitter.emit('labels:meta')

        emitter.emit(state.events.RENDER)
      })

      state.prefetch.push(request)
    })

    function setMeta () {
      const { name, id, avatar = {}, description } = state.label.data

      const title = {
        labels: 'Labels',
        'labels/:uid': name,
        'labels/:uid/albums': name,
        'labels/:uid/artists': name
      }[state.route]

      if (!title) return

      state.shortTitle = title

      state.title = setTitle(title)
      state.shortTitle = title

      const image = {
        'labels/:uid': avatar.original || ''
      }[state.route]

      const cover = {
        'labels/:uid': avatar.cover || ''
      }[state.route]

      state.meta = {
        title: state.title,
        'og:image': image,
        'og:title': state.title,
        'og:type': 'website',
        'og:url': `https://beta.resonate.is/labels/${id}`,
        'og:description': description || `Listen to ${name} on Resonate`,
        'twitter:card': 'summary_large_image',
        'twitter:title': state.title,
        'twitter:image': cover || image,
        'twitter:site': '@resonatecoop'
      }

      emitter.emit('meta', state.meta)
    }

    async function getLabels () {
      emitter.emit('labels:meta')

      const { events, machine } = state.components.labels

      if (machine.state === 'loading') {
        return
      }

      const startLoader = () => {
        events.emit('loader:toggle')
      }

      const loaderTimeout = setTimeout(startLoader, 1000)

      machine.emit('start')

      try {
        const pageNumber = state.query.page ? Number(state.query.page) : 1

        const response = await state.api.labels.find({ page: pageNumber - 1, limit: 50 })

        events.emit('loader:toggle')
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
        const uid = Number(state.params.uid)

        if (isNaN(uid)) {
          return emitter.emit(state.events.PUSHSTATE, '/')
        }

        const isNew = !state.label.data || state.label.data.id !== uid

        if (isNew) {
          state.label = {
            notFound: false,
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

        const response = await state.api.labels.findOne({ uid })

        if (!response.data) {
          state.label.notFound = true
        } else {
          state.label.data = response.data

          emitter.emit(state.events.RENDER)

          getLabelAlbums()
          getLabelArtists()
        }
      } catch (err) {
        log.error(err)
      } finally {
        emitter.emit('labels:meta')
        emitter.emit(state.events.RENDER)
      }
    }

    async function getLabelAlbums () {
      const uid = Number(state.params.uid)
      const isNew = state.artist.data.id !== uid

      try {
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

          const response = await state.api.labels.findOne({ uid })

          if (!response.data) {
            state.label.notFound = true
          } else {
            state.label.data = response.data

            emitter.emit(state.events.RENDER)
          }
        } else {
          emitter.emit('labels:meta')
        }

        if (state.label.notFound) return

        const pageNumber = state.query.page ? Number(state.query.page) : 1

        const response = await state.api.labels.getAlbums({
          uid,
          limit: 5,
          page: pageNumber - 1
        })

        state.label.albums.items = response.data || []
        state.label.albums.count = response.count
        state.label.albums.numberOfPages = response.numberOfPages || 1

        emitter.emit('labels:meta')

        emitter.emit(state.events.RENDER)
      } catch (err) {
        log.error(err)
      }
    }

    async function getLabelArtists () {
      const uid = Number(state.params.uid)
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
        state.label.artists.count = artists.count
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
