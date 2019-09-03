const { isBrowser } = require('browser-or-node')
const PlayCount = require('@resonate/play-count')
const renderCounter = require('@resonate/counter')
const logger = require('nanologger')
const log = logger('store:player')
const storage = require('localforage')
const Player = require('@resonate/player-component')

module.exports = player

function updateCounter (props, element) {
  const { count, track } = props
  const { id } = track

  const playCount = new PlayCount(count)

  const counter = renderCounter(`cid-${id}`)

  playCount.counter = counter

  if (element) {
    const parent = element.parentNode
    parent.replaceChild(playCount.counter, element)
  }
}

function setPlaycount (props) {
  const { track } = props
  for (const counter of [...document.querySelectorAll(`#cid-${track.id}`)]) {
    updateCounter(props, counter)
  }
}

function player () {
  return (state, emitter) => {
    const player = isBrowser ? state.cache(Player, 'player-footer') : {}

    state.track = state.track || {
      data: {}
    }

    emitter.on('player:error', (props) => {
      const { reason } = props
      emitter.emit('notify', { type: 'error', timeout: 4000, message: reason })
    })

    emitter.on('player:cap', async (track) => {
      try {
        const response = await state.api.plays.add({
          uid: state.api.user.uid, // 0 if user is not authenticated
          tid: track.id
        })

        if (response.status === 401) {
          log.info('User is not authorized to play')

          player.playback.emit('stop')

          emitter.emit('notify', { message: 'You are not logged in' })

          return emitter.emit('logout', true) // logout and redirect
        }

        if (response.data && response.status === 'ok') {
          const { count, total } = response.data

          if (count >= 1) {
            setPlaycount({ count, track })

            log.info(`Tracked a play count for ${track.title}`)
          }

          const user = await storage.getItem('user')

          if (user) {
            await storage.setItem('user', Object.assign(user, { credits: total }))

            state.user = await storage.getItem('user')
          }
        }
      } catch (err) {
        log.error(err)
      } finally {
        emitter.emit(state.events.RENDER)
      }
    })
  }
}
