const html = require('choo/html')
const Component = require('choo/component')
const input = require('@resonate/input-element')
const button = require('@resonate/button')
const isEmpty = require('validator/lib/isEmpty')
const messages = require('./messages')
// const morph = require('nanomorph')
const validateFormdata = require('validate-formdata')
const Uploader = require('../uploader')

class ReleaseForm extends Component {
  constructor (id, state, emit) {
    super(id)

    this.emit = emit
    this.state = state
    this.local = state.components[id] = {}

    this.handleSubmit = this.handleSubmit.bind(this)

    this.validator = validateFormdata()
    this.form = this.validator.state
  }

  handleSubmit (e) {
    e.preventDefault()

    for (let field of e.target.elements) {
      const isRequired = field.required
      const name = field.name || ''
      const value = field.value || ''

      if (isRequired) {
        this.validator.validate(name, value)
      }
    }

    this.rerender()

    const invalidInput = document.querySelector('.invalid')

    if (invalidInput) invalidInput.focus({ preventScroll: false }) // focus to first invalid input

    if (this.form.valid) {
      this.emit(this.state.events.PUSHSTATE, '/')
    }
  }

  createElement (props) {
    const pristine = this.form.pristine
    const errors = this.form.errors
    const values = this.form.values

    const uploadArtwork = this.state.cache(Uploader, 'upload-artwork').render({
      form: this.form,
      validator: this.validator,
      required: true,
      format: { width: 1600, height: 1600 },
      accept: 'image/jpeg,image/jpg,image/png',
      ratio: '1600x1600px'
    })

    const albumArtistInput = input({
      type: 'text',
      name: 'albumArtist',
      invalid: errors.albumArtist && !pristine.albumArtist,
      value: values.albumArtist,
      onchange: (e) => {
        this.validator.validate(e.target.name, e.target.value)
        this.rerender()
      }
    })

    const releaseTitleInput = input({
      type: 'text',
      name: 'releaseTitle',
      invalid: errors.releaseTitle && !pristine.releaseTitle,
      value: values.releaseTitle,
      onchange: (e) => {
        this.validator.validate(e.target.name, e.target.value)
        this.rerender()
      }
    })

    return html`
      <div class="flex flex-column">
        ${messages(this.state, this.form)}

        <form novalidate onsubmit=${this.handleSubmit}>
          <div class="mb5">
            <label for="albumArtist" class="f4 db mv2">Album artist</label>

            <p>This may or may not be the same as your profile name.</p>

            ${albumArtistInput}

            <p class="ma0 pa0 message warning">${errors.albumArtist && !pristine.albumArtist ? errors.albumArtist.message : ''}</p>
          </div>

          <div class="mb5">
            <label for="releaseTitle" class="f4 db mv2">Release title</label>

            <p>The name of this release as you want it to appear publicly.</p>

            ${releaseTitleInput}

            <p class="ma0 pa0 message warning">${errors.releaseTitle && !pristine.releaseTitle ? errors.releaseTitle.message : ''}</p>
          </div>

          <div class="mb5">
            <label for="artwork" class="f4 db mv2">Artwork</label>
            ${uploadArtwork}
          </div>

          ${button({ type: 'submit', text: 'Continue', style: 'default', size: 'none' })}
        </form>
      </div>
    `
  }

  load () {
    this.validator.field('albumArtist', (data) => {
      if (isEmpty(data)) return new Error('Album artist is required')
    })
    this.validator.field('releaseTitle', (data) => {
      if (isEmpty(data)) return new Error('Release title is required')
    })
  }

  update () {
    return true
  }
}

module.exports = ReleaseForm
