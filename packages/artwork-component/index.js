const Nanocomponent = require('nanocomponent')
const nanostate = require('nanostate')
const animation = require('nanoanimation')
const html = require('nanohtml')

/* global fetch, Request, URL */

class Artwork extends Nanocomponent {
  constructor (name) {
    super(name)

    this.machine = nanostate('idle', {
      idle: { load: 'loading' },
      loading: { resolve: 'data', reject: 'error' },
      data: { resolve: 'loading' },
      error: { resolve: 'idle' }
    })

    this.machine.on('data', () => {
      if (this.element) this.rerender()
    })

    this.renderArtwork = this.renderArtwork.bind(this)
    this.fetch = this.fetch.bind(this)
  }

  createElement (props) {
    this.url = props.url
    this.animate = props.animate
    this.style = props.style || {}

    const artwork = {
      loading: () => {},
      data: this.renderArtwork()
    }[this.machine.state]

    return html`
      <div>
        ${artwork}
      </div>
    `
  }

  renderArtwork () {
    const el = html`
      <img class="db" width=100% decoding="auto" src=${this.blob}">
    `

    for (const [key, value] of Object.entries(this.style)) {
      el.style[key] = value
    }

    if (this.animate) {
      animation([
        { opacity: 0 },
        { opacity: 1 }
      ], {
        duration: 300,
        fill: 'forwards'
      })(el).play()
    }

    return el
  }

  fetch () {
    const request = new Request(this.url)

    fetch(request).then(response => {
      return response.blob()
    }).then(blob => {
      const objectURL = URL.createObjectURL(blob)
      this.blob = objectURL
      this.machine.emit('resolve')
    }).catch(err => {
      if (err) { console.log(err) }
      this.machine.emit('reject')
    })
  }

  load (el) {
    this.machine.emit('load')

    if (this.url) {
      this.fetch()
    }
  }

  afterupdate (el) {
    if (this.url) {
      this.fetch()
    }
  }

  update (props) {
    return this.url !== props.url
  }
}

module.exports = Artwork
