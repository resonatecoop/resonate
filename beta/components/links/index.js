const html = require('choo/html')
const Component = require('choo/component')
const morph = require('nanomorph')
const normalizeUrl = require('normalize-url')

const apiFactoryGenerator = require('@resonate/api-factory-generator')
const api = apiFactoryGenerator({
  artists: {
    getLinks: {
      path: '/artists/[:uid]/links',
      schema: {
        type: 'object',
        properties: {
          uid: {
            type: 'number'
          }
        }
      }
    }
  }
}, {
  scheme: 'https://',
  domain: process.env.API_DOMAIN || 'api.resonate.localhost',
  prefix: process.env.API_PREFIX || '/v1',
  version: 1
})

class Links extends Component {
  constructor (name, state, emit) {
    super(name)

    this.state = state
    this.emit = emit

    this.items = []
  }

  createElement (props) {
    this.uid = props.uid

    return html`
      <div>
        ${this.renderLinks(this.items)}
      </div>
    `
  }

  renderLinks (items) {
    const links = items.map(linkItem)

    return html`
      <ul class="links flex flex-column list ma0 pa0">
        ${links}
      </ul>
    `

    function linkItem ({ url: value, platform }) {
      if (!value.includes(platform) && platform === 'facebook') {
        value = value.replace(/^/, 'https://facebook.com/')
      }
      if (!value.includes(platform) && platform === 'twitter') {
        value = value.replace(/^/, 'https://twitter.com/')
      }
      const url = normalizeUrl(value, { stripWWW: false })
      return html`
        <li class="mb3">
          <a target="_blank" rel="noopener noreferer" href="${url}" class="link flex items-center ttc color-inherit">
            ${platform}
          </a>
        </li>
      `
    }
  }

  async getLinks (uid) {
    const response = await api.artists.getLinks(uid)
    const items = response.data
    return items
  }

  async load () {
    const items = await this.getLinks(this.uid)
    morph(this.element.querySelector('.links'), this.renderLinks(items))
  }

  update (props) {
    if (props.uid !== this.uid) {
      return true
    }
    return false
  }
}

module.exports = Links
