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
      data: {
        track: {}
      }
    }

    emitter.on('clipboard', (text) => {
      copy(text)
      emitter.emit('notify', { message: 'Copied to clipboard' })
    })

    emitter.on('tracks:meta', setMeta)

    function setMeta () {
      const track = state.track.data.track || {}
      const { id, cover, title: trackTitle } = track

      const title = {
        'tracks/:id': trackTitle
      }[state.route]

      if (!title) return

      state.shortTitle = title

      const fullTitle = setTitle(title)
      const image = {
        'tracks/:id': cover
      }[state.route]

      state.meta = {
        title: fullTitle,
        'og:image': image,
        'og:title': fullTitle,
        'og:type': 'website',
        'og:url': `https://beta.resonate.is/tracks/${id}`,
        'og:description': `Listen to ${trackTitle} on Resonate`,
        'twitter:card': 'summary_large_image',
        'twitter:title': fullTitle,
        'twitter:image': image,
        'twitter:site': '@resonatecoop'
      }

      emitter.emit('meta', state.meta)
    }

    emitter.on('route:tracks/:id', async () => {
      const id = Number(state.params.id)
      const track = state.track.data.track || {}
      const isNew = track.id !== id

      if (isNew) {
        state.track = {
          data: {
            track: {}
          }
        }

        emitter.emit(state.events.RENDER)
      } else {
        emitter.emit('tracks:meta')
      }

      try {
        const response = await state.api.tracks.findOne({ id })

        if (response.data) {
          state.track.data = adapter(response.data)

          if (!state.tracks.length) {
            state.tracks.push(state.track.data)
          }

          emitter.emit('tracks:meta')

          emitter.emit(state.events.RENDER)
        }
      } catch (err) {
        log.error(err)
      }
    })
  }
}
