const html = require('choo/html')
const Component = require('choo/component')
const input = require('@resonate/input-element')
const button = require('@resonate/button')
const isEmpty = require('validator/lib/isEmpty')
const messages = require('./messages')
const isISO8601 = require('validator/lib/isISO8601')
const validateFormdata = require('validate-formdata')
const Uploader = require('../uploader')
const leftPad = require('left-pad')

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

    if (invalidInput) {
      invalidInput.focus({ preventScroll: false }) // focus to first invalid input
    }

    if (this.form.valid) {
      this.emit(this.state.events.PUSHSTATE, '/')
    }
  }

  createElement (props) {
    const self = this
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

    const month = input({
      name: 'month',
      type: 'text',
      maxlength: 2,
      classList: 'mw4',
      placeholder: 'MM',
      value: values.month,
      onchange: function (e) {
        const name = e.target.name
        const value = leftPad(e.target.value, 2, 0)

        return updateReleaseDate(name, value)
      }
    })

    const day = input({
      name: 'day',
      type: 'text',
      maxlength: 2,
      classList: 'mw4',
      placeholder: 'DD',
      value: values.day,
      onchange: function (e) {
        const name = e.target.name
        const value = leftPad(e.target.value, 2, 0)

        return updateReleaseDate(name, value)
      }
    })

    const year = input({
      name: 'year',
      maxlength: 4,
      type: 'text',
      classList: 'mw5',
      placeholder: 'YYYY',
      value: values.year,
      onchange: function (e) {
        const { name, value } = e.target

        return updateReleaseDate(name, value)
      }
    })

    const releaseDate = input({
      type: 'hidden',
      name: 'releaseDate',
      value: values.releaseDate
    })

    function updateReleaseDate (name, value) {
      self.validator.validate(name, value)

      const { month, day, year } = values
      const releaseDate = [year, month, day].filter(Boolean)

      if (releaseDate.length === 3) {
        self.element.querySelector('input[name=releaseDate]').value = releaseDate.join('-')
        self.validator.validate('releaseDate', releaseDate.join('-'))
      }

      self.rerender()
    }

    return html`
      <div class="flex flex-column">
        ${messages(this.state, this.form)}

        <form novalidate onsubmit=${this.handleSubmit}>
          <div class="mb5">
            <label for="albumArtist" class="f4 db mv2">Album artist</label>

            <p>This may or may not be the same as your profile name.</p>

            ${albumArtistInput}

            <p class="ma0 pa0 red">${errors.albumArtist && !pristine.albumArtist ? errors.albumArtist.message : ''}</p>
          </div>

          <div class="mb5">
            <label for="releaseTitle" class="f4 db mv2">Release title</label>

            <p>The name of this release as you want it to appear publicly.</p>

            ${releaseTitleInput}

            <p class="ma0 pa0 red">${errors.releaseTitle && !pristine.releaseTitle ? errors.releaseTitle.message : ''}</p>
          </div>

          <div class="mb5">
            <label for="artwork" class="f4 db mv2">Artwork</label>
            ${uploadArtwork}
          </div>

          <div class="mb5">
            <fieldset class="pa0 bn">
              <legend class="lh-copy mb2 f5">Release date</legend>
              <div class="flex">
                <div class="flex flex-auto mr2">
                  ${month}
                </div>
                <div class="flex flex-auto mr2">
                  ${day}
                </div>
                <div class="flex flex-auto">
                  ${year}
                </div>
              </div>
              ${releaseDate}
              <p class="ma0 pa0 red">${errors.month && !pristine.month ? errors.month.message : ''}</p>
              <p class="ma0 pa0 red">${errors.day && !pristine.day ? errors.day.message : ''}</p>
              <p class="ma0 pa0 red">${errors.year && !pristine.year ? errors.year.message : ''}</p>
              <p class="ma0 pa0 red">${errors.releaseDate && !pristine.releaseDate ? errors.releaseDate.message : ''}</p>
            </fieldset>
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
    this.validator.field('month', (data) => {
      if (isEmpty(data)) return new Error('Release month is required')
      if (Number(data) > 12 || Number(data) < 1) return new Error('Release month invalid')
    })
    this.validator.field('day', (data) => {
      if (isEmpty(data)) return new Error('Release day is required')
      if (Number(data) > 31 || Number(data) < 1) return new Error('Release day invalid')
    })
    this.validator.field('year', (data) => {
      if (isEmpty(data)) return new Error('Release year is required')
    })
    this.validator.field('releaseDate', (data) => {
      if (isEmpty(data)) return new Error('Release date is required')
      if (!isISO8601(data, { strict: true })) return new Error('Release date is invalid')
    })
  }

  update () {
    return true
  }
}

module.exports = ReleaseForm
