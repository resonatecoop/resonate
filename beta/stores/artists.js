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

    function setMeta () {
      const { name = '', avatar } = state.artist.data
      const title = {
        artists: 'Artists',
        'artists/:uid': name,
        'artists/:uid/albums': name
      }[state.route]

      if (!title) return

      state.shortTitle = title

      const fullTitle = setTitle(title)
      const image = {
        'artists/:uid': avatar ? avatar.original : ''
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

    async function getArtistAlbums () {
      const uid = parseInt(state.params.uid, 10)
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
      } else {
        emitter.emit('artists:meta')
      }

      const pageNumber = state.query.page ? Number(state.query.page) : 1

      try {
        const { data, numberOfPages } = await state.api.artists.getAlbums({ uid, limit: 5, page: pageNumber - 1 })

        state.artist.albums.items = data || []
        state.artist.albums.numberOfPages = numberOfPages

        emitter.emit('artists:meta')

        emitter.emit(state.events.RENDER)
      } catch (err) {
        log.error(err)
      }
    }

    async function getArtist () {
      const uid = parseInt(state.params.uid, 10)
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
      } else {
        emitter.emit('artists:meta')
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

      const { loader, machine } = state.components.artists
      const startLoader = () => {
        loader.emit('loader:toggle')
      }

      const loaderTimeout = setTimeout(startLoader, 300)

      try {
        const pageNumber = state.query.page ? Number(state.query.page) : 1

        machine.emit('start')

        const response = await state.api.artists.find({
          page: pageNumber - 1,
          limit: 20,
          order: 'desc',
          order_by: 'id'
        })

        loader.emit('loader:toggle')
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
