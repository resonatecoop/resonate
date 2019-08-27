const Nanocomponent = require('choo/component')
const html = require('choo/html')
const logger = require('nanologger')
const log = logger('artists-grid')
const apiFactoryGenerator = require('@resonate/api-factory-generator')

const api = apiFactoryGenerator({
  artists: {
    find: {
      path: '/artists',
      schema: {
        type: 'object',
        properties: {
          limit: {
            type: 'number',
            minimum: 0,
            maximum: 100
          },
          order: {
            type: 'string'
          }
        }
      }
    }
  }
}, {
  scheme: 'https://',
  domain: process.env.API_DOMAIN || 'api.resonate.localhost',
  prefix: '/v1',
  version: 1
})

class ArtistsRandomGrid extends Nanocomponent {
  constructor (name, state, emit) {
    super(name)

    this.name = name
    this.ids = []
    this.items = []

    this.state = state
    this.emit = emit

    this.loadArtists = this.loadArtists.bind(this)
  }

  createElement () {
    const item = ({ avatar, name: artist, id }) => {
      const filename = avatar.original || avatar.medium
      const url = filename || '/thumbs/default.png'
      return html`
        <li class="fl w-50 w-third-m w-20-l">
          <div class="db aspect-ratio aspect-ratio--1x1">
            <span role="img" aria-label=${artist} style="background: var(--near-black) url(${url}) no-repeat;" class="bg-center gray-100 hover-grayscale-0 cover aspect-ratio--object">
            </span>
          </div>
        </li>
      `
    }

    const items = this.items
      .filter(({ avatar }) => !!avatar)
      .slice(0, 24)
      .map(item)

    return html`
      <div class="fixed right-0 bottom-0 left-0" style="top:var(--height-3)">
        <ul class="list ma0 pa0 cf">
          ${items}
        </ul>
      </div>
    `
  }

  async loadArtists () {
    try {
      const response = await api.artists.find({
        limit: 100,
        order: 'random'
      })

      if (response.data) {
        this.items = response.data
        this.rerender()
      }
    } catch (err) {
      log.error(err)
    }
  }

  load () {
    if (!this.items.length) {
      this.loadArtists()
    }
  }

  update () {
    return false
  }
}

module.exports = ArtistsRandomGrid
