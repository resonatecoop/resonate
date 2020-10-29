const logger = require('nanologger')
const log = logger('featured-labels')
const Component = require('choo/component')
const compare = require('nanocomponent/compare')
const assert = require('assert')
const html = require('choo/html')
const clone = require('shallow-clone')
const Labels = require('../labels')
const storage = require('localforage')

class FeaturedLabels extends Component {
  constructor (id, state, emit) {
    super(id)

    this.state = state
    this.emit = emit
    this.local = state.components[id] = {}

    this.local.ids = []
    this.local.items = []

    this.fetch = this.fetch.bind(this)
  }

  createElement (props) {
    this.local.title = props.title
    this.local.ids = clone(props.ids)

    const labels = this.state.cache(Labels, this._name + '-list').render({
      items: this.local.items,
      pagination: false
    })

    return html`
      <section class="flex flex-column flex-auto w-100">
        <h3 class="lh-title ml3 mt4 mb3 ttc f3 normal">${this.local.title}</h3>
        ${labels}
      </section>
    `
  }

  async fetch (ids) {
    const key = this._name + '-' + process.env.FEATURED_CONTENT_VERSION

    try {
      const data = await storage.getItem(key)

      if (!data) {
        const response = await this.state.api.artists.query(ids)

        if (response.data) {
          this.local.items = response.data

          await storage.setItem(key, this.local.items)
        }
      } else {
        this.local.items = data
      }
    } catch (err) {
      log.error(err)
    } finally {
      this.rerender()
    }
  }

  load () {
    this.fetch(this.local.ids)
  }

  update (props) {
    assert(Array.isArray(props.ids), 'props.ids must be an array')
    return compare(this.local.ids, props.ids)
  }
}

module.exports = FeaturedLabels
