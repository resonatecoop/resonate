const promiseHash = require('promise-hash/lib/promise-hash')
const nanologger = require('nanologger')
const log = nanologger('store:artists')
const adapter = require('@resonate/schemas/adapters/v1/track')
const setTitle = require('../lib/title')
const Artists = require('../components/artists')
const Albums = require('../components/albums')

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
      newTracks: [],
      topTracks: [],
      albums: {
        items: [],
        numberOfPages: 1
      },
      latestRelease: {
        items: []
      },
      tracks: []
    }

    state.cache(Artists, 'artists')

    emitter.on('artists:meta', setMeta)
    emitter.on('route:artists/:uid/albums', getArtistAlbums)

    emitter.on('route:artists/:uid/tracks', getArtist)
    emitter.on('route:artists', getArtists)
    emitter.on('route:artists/:uid', getArtist)

    /*
     * Prefetch critical artist data
     */

    emitter.once('prefetch:artists', () => {
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

      if (state.prefetch) state.prefetch.push(request)
    })

    emitter.once('prefetch:artist', (id) => {
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

      if (state.prefetch) state.prefetch.push(request)
    })

    function setMeta () {
      const { name, id, avatar, description } = state.artist.data
      const title = {
        'artists': 'Artists',
        'artists/:uid': name,
        'artists/:uid/albums': name
      }[state.route]

      if (!title) return

      state.title = setTitle(title)
      state.shortTitle = title

      const image = {
        'artists/:uid': avatar ? avatar.original : ''
      }[state.route]

      state.meta = {
        'title': state.title,
        'og:title': state.title,
        'og:type': 'website',
        'og:url': `https://beta.resonate.is/artists/${id}`,
        'og:image': image,
        'og:image:type': 'image/jpeg',
        'og:description': description || `Listen to ${name} on Resonate`,
        'twitter:card': 'summary_large_image',
        'twitter:title': state.title,
        'twitter:image': image,
        'twitter:site': '@resonatecoop'
      }

      emitter.emit('meta', state.meta)
    }

    async function getArtistAlbums () {
      const uid = Number(state.params.uid)
      const isNew = state.artist.data.id !== uid

      if (isNew) {
        state.artist = {
          data: {},
          tracks: [],
          albums: {
            items: [],
            numberOfPages: 1
          },
          latestRelease: {
            items: []
          },
          topTracks: []
        }

        emitter.emit(state.events.RENDER)
      }

      const cpnId = `artist-albums-${uid}`
      const { loader, machine } = state.components[cpnId] || state.cache(Albums, cpnId).local
      const startLoader = () => {
        loader.emit('loader:toggle')
      }
      const loaderTimeout = setTimeout(startLoader, 300)

      machine.emit('start')

      const pageNumber = state.query.page ? Number(state.query.page) : 1

      try {
        const { data, numberOfPages } = await state.api.artists.getAlbums({
          uid,
          limit: 5,
          page: pageNumber - 1
        })

        machine.emit('resolve')
        loader.state.loader === 'on' && loader.emit('loader:toggle')

        state.artist.albums.items = data || []
        state.artist.albums.numberOfPages = numberOfPages

        emitter.emit('artists:meta')

        emitter.emit(state.events.RENDER)
      } catch (err) {
        machine.emit('reject')
        log.error(err)
      } finally {
        clearTimeout(loaderTimeout)
      }
    }

    async function getArtist () {
      const uid = Number(state.params.uid)
      const isNew = state.artist.data.id !== uid

      if (isNew) {
        state.artist = {
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

        emitter.emit(state.events.RENDER)
      }

      try {
        const artist = await state.api.artists.findOne({ uid })

        if (!artist.data) return // TODO Handle 404

        state.artist.data = artist.data

        emitter.emit('artists:meta')

        emitter.emit(state.events.RENDER)

        const { topTracks, tracks, latestRelease } = await promiseHash({
          topTracks: state.api.artists.getTopTracks({ uid, limit: 3 }),
          latestRelease: state.api.artists.getLatestRelease({ uid }),
          tracks: state.api.artists.getTracks({ uid, limit: 10 })
        })

        if (latestRelease.data) {
          state.artist.latestRelease.items = latestRelease.data
        }

        if (tracks.data) {
          state.artist.tracks = tracks.data.map(adapter)

          if (!state.tracks.length) {
            state.tracks = state.artist.tracks
          }
        }

        if (topTracks.data) {
          state.artist.topTracks = topTracks.data.map(adapter)

          if (!state.tracks.length) {
            state.tracks = state.artist.topTracks
          }
        }

        emitter.emit(state.events.RENDER)

        const { albums } = await promiseHash({
          albums: state.api.artists.getAlbums({ uid, limit: 5, page: 0 })
        })

        if (albums.data) {
          state.artist.albums.items = albums.data
          state.artist.albums.numberOfPages = albums.numberOfPages
        }

        emitter.emit(state.events.RENDER)
      } catch (err) {
        log.error(err)
      }
    }

    async function getArtists () {
      emitter.emit('artists:meta')

      const { loader, machine } = state.components['artists']
      const startLoader = () => {
        loader.emit('loader:toggle')
      }
      const loaderTimeout = setTimeout(startLoader, 300)
      const pageNumber = state.query.page ? Number(state.query.page) : 1
      machine.emit('start')

      try {
        const response = await state.api.artists.find({
          page: pageNumber - 1,
          limit: 20,
          order: 'desc',
          order_by: 'id'
        })

        loader.state.loader === 'on' && loader.emit('loader:toggle')
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
