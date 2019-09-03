const Nanocomponent = require('nanocomponent')
const nanologger = require('nanologger')
const html = require('choo/html')
const TrackComponent = require('@resonate/track-component')

class TrackDetails extends Nanocomponent {
  constructor (name, state, emit) {
    super(name)

    this.emit = emit
    this.state = state

    this.log = nanologger(name)
  }

  createElement (props = {}) {
    this._track_group = props.track_group
    this._track = props.track || {}
    this._url = props.url
    this._count = props.count
    this._fav = props.fav
    this._playlist = []

    const trackComponent = this._track.id ? new TrackComponent(`track-${this._track.id}`, this.state, this.emit).render({
      style: 'blank',
      count: this._count,
      index: 0,
      fav: this._fav,
      src: this._url,
      track: this._track,
      trackGroup: this._track_group,
      playlist: this._playlist
    }) : ''

    return html`
      <article class="mb6 flex flex-column flex-row-l flex-auto">
        <div class="flex flex-auto flex-column mw5-m mw6-l">
          <div class="db aspect-ratio aspect-ratio--1x1">
            <span role="img" style="background:url(${this._track.cover}) no-repeat;" class="bg-center cover aspect-ratio--object z-1">
            </span>
          </div>
        </div>
        <div class="flex flex-column flex-auto pa3">
          ${trackComponent}
        </div>
      </article>
    `
  }

  update (props) {
    return props.track.id !== this._track.id
  }
}

module.exports = TrackDetails
