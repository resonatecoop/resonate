const promiseHash = require('promise-hash/lib/promise-hash')
const nanologger = require('nanologger')
const log = nanologger('store:artists')
const adapter = require('@resonate/schemas/adapters/v1/track')
const setTitle = require('../lib/title')
const Artists = require('../components/artists')

module.exports = artists

/*
 * @description Store for artists
 */

function artists () {
  return (state, emitter) => {
    state.artists = state.artists || {
      items: [],
      numberOfPages: 1
    }

    state.artist = state.artist || {
      data: {},
      label: {},
      albums: {
        items: [],
        numberOfPages: 1
      },
      latestRelease: {
        items: []
      },
      topTracks: {
        items: []
      },
      tracks: []
    }

    state.cache(Artists, 'artists')

    emitter.once('prefetch:artists', () => {
      if (!state.prefetch) return

      emitter.emit('artists:meta')

      state.artists = state.artists || {
        items: [],
        numberOfPages: 1
      }

      const pageNumber = state.query.page ? Number(state.query.page) : 1
      const request = state.api.artists.find({
        page: pageNumber - 1,
        limit: 20,
        order: 'desc',
        order_by: 'id'
      }).then((response) => {
        if (response.data) {
          state.artists.items = response.data
          state.artists.numberOfPages = response.numberOfPages
        }

        emitter.emit(state.events.RENDER)
      })

      state.prefetch.push(request)
    })

    emitter.once('prefetch:artist', (id) => {
      if (!state.prefetch) return
      if (!id) return

      state.artist = state.artist || {
        data: {},
        tracks: [],
        albums: {
          items: [],
          numberOfPages: 1
        },
        latestRelease: {
          items: []
        },
        topTracks: [],
        newTracks: []
      }

      const request = state.api.artists.findOne({ uid: id }).then((response) => {
        if (response.data) {
          state.artist.data = response.data
        }

        emitter.emit('artists:meta')

        emitter.emit(state.events.RENDER)
      })

      state.prefetch.push(request)
    })
    emitter.on('artists:meta', setMeta)
    emitter.on('artists:clear', () => {
      state.artist = {
        data: {},
        notFound: false,
        tracks: [],
        albums: {
          items: [],
          numberOfPages: 1
        },
        latestRelease: {
          items: []
        },
        topTracks: {
          items: []
        },
        label: {}
      }

      emitter.emit(state.events.RENDER)
    })
    emitter.on('route:artists/:uid/albums', getArtistAlbums)
    emitter.on('route:artists/:uid/tracks', getArtist)
    emitter.on('route:artists', getArtists)
    emitter.on('route:artists/:uid', getArtist)

    function setMeta () {
      const { name, id, avatar = {}, description } = state.artist.data
      const title = {
        artists: 'Artists',
        'artists/:uid': name,
        'artists/:uid/albums': name
      }[state.route]

      if (!title) return

      state.title = setTitle(title)
      state.shortTitle = title

      const image = {
        'artists/:uid': avatar.original || '' // fallback
      }[state.route]

      const cover = {
        'artists/:uid': avatar.cover || '' // fallback ?
      }[state.route]

      state.meta = {
        title: state.title,
        'og:title': state.title,
        'og:type': 'website',
        'og:url': `https://beta.resonate.is/artists/${id}`,
        'og:image': image,
        'og:description': description || `Listen to ${name} on Resonate`,
        'twitter:card': 'summary_large_image',
        'twitter:title': state.title,
        'twitter:image': cover || image,
        'twitter:site': '@resonatecoop'
      }

      emitter.emit('meta', state.meta)
    }

    async function getArtistAlbums () {
      const uid = Number(state.params.uid)
      const isNew = state.artist.data.id !== uid

      try {
        if (isNew) {
          emitter.emit('artists:clear')

          const response = await state.api.artists.findOne({ uid })

          if (!response.data) {
            state.artist.notFound = true
          } else {
            state.artist.data = response.data

            emitter.emit(state.events.RENDER)
          }
        } else {
          emitter.emit('artists:meta')
        }

        if (state.artist.notFound) return

        const pageNumber = state.query.page ? Number(state.query.page) : 1
        const response = await state.api.artists.getAlbums({
          uid,
          limit: 5,
          page: pageNumber - 1
        })

        if (response.data) {
          state.artist.albums.items = response.data || []
          state.artist.albums.count = response.count
          state.artist.albums.numberOfPages = response.numberOfPages

          emitter.emit('artists:meta')
        }
      } catch (err) {
        log.error(err)
      } finally {
        emitter.emit(state.events.RENDER)
      }
    }

    async function getLatestRelease () {
      const uid = Number(state.params.uid)
      const response = await state.api.artists.getLatestRelease(uid)

      if (response.data) {
        state.artist.latestRelease.items = response.data

        emitter.emit(state.events.RENDER)
      }
    }

    async function getTracks (limit = 10) {
      const uid = Number(state.params.uid)
      const { tracks, topTracks } = await promiseHash({
        tracks: state.api.artists.getTracks(uid, limit),
        topTracks: state.api.artists.getTopTracks(uid, 5)
      })

      if (topTracks.data) {
        state.artist.topTracks.items = topTracks.data.map(adapter)

        if (!state.tracks.length) {
          state.tracks = state.artist.topTracks.items
        }

        emitter.emit(state.events.RENDER)
      } else if (tracks.data) {
        state.artist.tracks = tracks.data.map(adapter)

        if (!state.tracks.length) {
          state.tracks = state.artist.tracks
        }

        emitter.emit(state.events.RENDER)
      }
    }

    async function getArtistLabel () {
      const uid = Number(state.params.uid)

      const response = await state.api.artists.getLabel(uid)

      if (response.data) {
        state.artist.label.data = response.data

        emitter.emit(state.events.RENDER)
      }
    }

    async function getArtist () {
      const uid = Number(state.params.uid)

      if (isNaN(uid)) {
        return emitter.emit(state.events.PUSHSTATE, '/')
      }

      const isNew = !state.artist.data || state.artist.data.id !== uid

      if (isNew) {
        emitter.emit('artists:clear')
      } else {
        emitter.emit('artists:meta')
      }

      try {
        const artist = await state.api.artists.findOne({ uid })

        if (!artist.data) {
          state.artist.notFound = true
        } else {
          state.artist.data = artist.data

          emitter.emit(state.events.RENDER)

          getTracks()
          getLatestRelease()
          getArtistAlbums()
          getArtistLabel()
        }
      } catch (err) {
        emitter.emit('error', err)
        log.error(err)
      } finally {
        emitter.emit('artists:meta')
        emitter.emit(state.events.RENDER)
      }
    }

    async function getArtists () {
      emitter.emit('artists:meta')

      const { events, machine } = state.components.artists

      if (machine.state === 'loading') {
        return
      }

      const loaderTimeout = setTimeout(() => {
        events.emit('loader:toggle')
      }, 1000)
      const pageNumber = state.query.page ? Number(state.query.page) : 1

      machine.emit('start')

      try {
        const response = await state.api.artists.find({
          page: pageNumber - 1,
          limit: 50,
          order: 'desc',
          order_by: 'id'
        })

        events.emit('loader:toggle')
        machine.emit('resolve')

        if (response.data) {
          state.artists.items = response.data
          state.artists.numberOfPages = response.numberOfPages
        }

        emitter.emit(state.events.RENDER)
      } catch (err) {
        machine.emit('reject')
        log.error(err)
      } finally {
        clearTimeout(loaderTimeout)
      }
    }
  }
}
