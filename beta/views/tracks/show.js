const viewLayout = require('../../elements/view-layout')

const { isNode } = require('browser-or-node')
const html = require('choo/html')
const TrackDetails = require('../../components/track-details')

module.exports = () => {
  return (state, emit) => {
    const id = Number(state.params.id)

    isNode && emit('prefetch:track', id)

    const trackDetails = state.cache(TrackDetails, `track-details-${state.params.id}`).render(state.track.data)

    return viewLayout((state, emit) => html`
      <div class="flex flex-auto flex-column">
        ${trackDetails}
      </div>
    `
    )(state, emit)
  }
}
