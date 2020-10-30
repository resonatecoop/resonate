const logger = require('nanologger')
const log = logger('store:tracks')
const adapter = require('@resonate/schemas/adapters/v1/track')
const setTitle = require('../lib/title')
const copy = require('clipboard-copy')
const Dialog = require('@resonate/dialog-component')
const html = require('choo/html')
const setPlaycount = require('../lib/update-counter')
const storage = require('localforage')
const button = require('@resonate/button')
const link = require('@resonate/link-element')

const {
  formatCredit,
  calculateRemainingCost
} = require('@resonate/utils')

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

    emitter.on('tracks:meta', () => {
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
    })

    emitter.once('prefetch:track', (id) => {
      if (!state.prefetch) return
      if (!id) return

      state.track = state.track || {
        data: { track: {} }
      }

      const request = state.api.tracks.findOne({ id }).then((response) => {
        if (response.data) {
          state.track.data = adapter(response.data)

          if (!state.tracks.length) {
            state.tracks.push(state.track.data)
          }
        }

        emitter.emit('tracks:meta')

        emitter.emit(state.events.RENDER)
      })

      state.prefetch.push(request)
    })

    emitter.on('tracks:buy', async (trackId) => {
      try {
        let response = await state.api.plays.buy({
          uid: state.user.uid,
          tid: trackId
        })

        const dialog = state.cache(Dialog, 'buy-track-dialog')

        dialog.destroy()

        const delay = 1000 // set delay to spawn success|error dialog

        if (response.status === 'ok' && response.data.count === 9) {
          setPlaycount({ count: 9, id: trackId })

          const { total } = response.data

          const user = await storage.getItem('user')

          if (user) {
            await storage.setItem('user', Object.assign(user, { credits: total }))

            state.user = await storage.getItem('user')
          }

          response = await state.api.tracks.findOne({ id: trackId })

          const { name, artist } = response.data

          return setTimeout(() => {
            const successDialog = state.cache(Dialog, 'success-dialog')
            const dialogEl = successDialog.render({
              title: 'Congrats!',
              prefix: 'dialog-default dialog--sm',
              content: html`
                <div class="flex flex-column w-100">
                  <dl>
                    <dt class="f5 lh-copy">You now own:</dt>
                    <dd class="f5 lh-copy ma0"><b>${name}</b> by ${artist}</dd>
                  </dl>

                  <p class="lh-copy f5">You may continue to stream this song for free or download the file:</p>

                  <div class="flex items-start">
                    ${button({ disabled: true, text: 'Download' })}

                    <p class="lh-copy f5 ma0 pa0 pl2">Download option is currently unavailable.</p>
                  </div>
                </div>

              `
            })

            document.body.appendChild(dialogEl)

            emitter.emit('refresh') // refresh view
          }, delay)
        } else if (response.status === 'ok' && response.data.count < 9 && Number(response.data.total) < 1.0220) {
          const cost = calculateRemainingCost(response.data.count)

          return setTimeout(() => {
            const errorDialog = state.cache(Dialog, 'error-dialog')
            const support = link({
              prefix: 'link bb bw pb1 b--near-black b',
              text: 'our support page',
              href: 'https://resonate.is/music/support',
              target: '_blank'
            })

            const dialogEl = errorDialog.render({
              title: 'Not enough credits available',
              prefix: 'dialog-default dialog--sm',
              content: html`
                <div class="flex flex-column w-100">
                  <p class="lh-copy f5">To buy this track, make sure you have at least <b>${formatCredit(cost)}</b> credits available.</p>
                  <p class="lh-copy f5">If you need help for purchasing credits, ${support} should provide the information you need.</p>
                </div>
              `
            })

            document.body.appendChild(dialogEl)
          }, delay)
        } else {
          return setTimeout(() => {
            const errorDialog = state.cache(Dialog, 'error-dialog')
            const support = link({
              prefix: 'link bb bw pb1 b--near-black b',
              text: 'More information on our support page',
              href: 'https://resonate.is/music/support',
              target: '_blank'
            })
            const dialogEl = errorDialog.render({
              title: 'Something unexpected happened',
              prefix: 'dialog-default dialog--sm',
              content: html`
                <div class="flex flex-column w-100">
                  <p class="lh-copy f5">Something bad happened</p>
                  <p class="lh-copy f5">Please contact support. ${support}.</p>
                </div>
              `
            })

            document.body.appendChild(dialogEl)
          }, delay)
        }
      } catch (err) {
        emitter.emit('error', err)
        log.error(err)
      }
    })

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
