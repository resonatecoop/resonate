const logger = require('nanologger')
const log = logger('featured-labels')
const Nanocomponent = require('nanocomponent')
const compare = require('nanocomponent/compare')
const assert = require('assert')
const html = require('choo/html')
const clone = require('shallow-clone')
const Labels = require('../labels')
const storage = require('localforage')

class FeaturedLabels extends Nanocomponent {
  constructor (name, state, emit) {
    super(name)

    this.name = name
    this.ids = []
    this.items = []

    this.state = state
    this.emit = emit

    this.fetch = this.fetch.bind(this)
  }

  createElement (props) {
    this.title = props.title
    this.ids = clone(props.ids)

    const labels = this.state.cache(Labels, this.name + '-list').render({
      items: this.items,
      pagination: false
    })

    return html`
      <section class="flex flex-column flex-auto w-100">
        <h2 class="lh-title ml3 mt4 mb3 ttc f3 normal">${this.title}</h2>
        ${labels}
      </section>
    `
  }

  async fetch (ids) {
    const key = this.name + '-' + process.env.FEATURED_CONTENT_VERSION

    try {
      const data = await storage.getItem(key)
      if (!data) {
        const response = await this.state.api.artists.query(ids)

        if (response.data) {
          this.items = response.data

          await storage.setItem(key, this.items)
        }
      } else {
        this.items = data
      }
    } catch (err) {
      log.error(err)
    } finally {
      this.rerender()
    }
  }

  load () {
    this.fetch(this.ids)
  }

  update (props) {
    assert(Array.isArray(props.ids), 'props.ids must be an array')
    return compare(this.ids, props.ids)
  }
}

module.exports = FeaturedLabels
