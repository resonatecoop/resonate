/**
 * Logging
 */

const logger = require('nanologger')
const log = logger('store:tracks')
const adapter = require('@resonate/schemas/adapters/v1/track')
const setTitle = require('../lib/title')
const copy = require('clipboard-copy')

module.exports = tracks

function tracks () {
  return (state, emitter) => {
    state.track = state.track || {
      data: {}
    }

    emitter.on('clipboard', (text) => {
      copy(text)
      emitter.emit('notify', { message: 'Copied to clipboard' })
    })

    emitter.on('tracks:meta', setMeta)

    function setMeta () {
      const { id, artwork, title: trackTitle } = state.track.data

      const title = {
        'tracks/:id': trackTitle
      }[state.route]

      if (!title) return

      state.shortTitle = title

      state.title = setTitle(title)
      state.shortTitle = title

      const image = {
        'tracks/:id': artwork.large
      }[state.route]

      state.meta = {
        'title': state.title,
        'og:image': image,
        'og:title': state.title,
        'og:type': 'website',
        'og:url': `https://beta.resonate.is/tracks/${id}`,
        'og:description': `Listen to ${trackTitle} on Resonate`,
        'twitter:card': 'summary_large_image',
        'twitter:title': state.title,
        'twitter:image': image,
        'twitter:site': '@resonatecoop'
      }

      emitter.emit('meta', state.meta)
    }

    emitter.once('prefetch:track', (id) => {
      state.track = state.track || {
        data: {}
      }

      const request = state.api.tracks.findOne({ id }).then((response) => {
        if (response.data) {
          state.track.data = adapter(response.data)
        }

        emitter.emit('tracks:meta')

        emitter.emit(state.events.RENDER)
      })

      if (state.prefetch) state.prefetch.push(request)
    })

    emitter.on('route:tracks/:id', async () => {
      const id = Number(state.params.id)
      const isNew = state.track.data.id !== id

      if (!isNew) return

      state.track = {
        data: {}
      }

      emitter.emit(state.events.RENDER)

      try {
        const response = await state.api.tracks.findOne({ id })

        if (response.data) {
          state.track.data = adapter(response.data)

          emitter.emit('tracks:meta')

          emitter.emit(state.events.RENDER)
        }
      } catch (err) {
        log.error(err)
      }
    })
  }
}
