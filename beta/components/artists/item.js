const Component = require('choo/component')
const html = require('choo/html')

class Artist extends Component {
  constructor (id, state, emit) {
    super(id)

    this.state = state
    this.emit = emit
    this.local = {}
  }

  createElement (props) {
    const { avatar: image = {}, id, name } = props
    const fallback = image.original || '/images/default.png'
    const { large = fallback } = image

    return html`
      <a class="db aspect-ratio aspect-ratio--1x1 bg-dark-gray bg-dark-gray--dark" href="/artists/${id}">
        <figure class="ma0">
          <img alt=${name} src=${large} decoding="auto" class="aspect-ratio--object z-1">
          <figcaption class="absolute bottom-0 truncate w-100 h2" style="top:100%;">
            ${name}
          </figcaption>
        </figure>
      </a>
    `
  }

  update () {
    return true
  }
}

module.exports = Artist
