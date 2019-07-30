const html = require('choo/html')
const Component = require('choo/component')
const input = require('@resonate/input-element')
const button = require('@resonate/button')
const textarea = require('@resonate/textarea-element')
const icon = require('@resonate/icon-element')
const messages = require('./messages')
const Uploader = require('../uploader')

const isEmpty = require('validator/lib/isEmpty')
const isLength = require('validator/lib/isLength')
const isISO8601 = require('validator/lib/isISO8601')
const validateFormdata = require('validate-formdata')
const ItemsInput = require('../tags-input')

const leftPad = require('left-pad')

const albumTypes = [
  { value: 'lp', text: 'LP' },
  { value: 'ep', text: 'EP' },
  { value: 'single', text: 'Single' }
]

class ReleaseForm extends Component {
  constructor (id, state, emit) {
    super(id)

    this.emit = emit
    this.state = state
    this.local = state.components[id] = {}
    this.local.albumType = 'ep'

    this.handleSubmit = this.handleSubmit.bind(this)

    this.validator = validateFormdata()
    this.form = this.validator.state
  }

  handleSubmit (e) {
    e.preventDefault()

    for (const field of e.target.elements) {
      console.log(field)
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

  createElement () {
    const self = this
    const pristine = this.form.pristine
    const errors = this.form.errors
    const values = this.form.values

    const uploadArtwork = renderField(this.state.cache(Uploader, 'upload-artwork').render({
      form: this.form,
      validator: this.validator,
      required: true,
      format: { width: 1600, height: 1600 },
      accept: 'image/jpeg,image/jpg,image/png',
      ratio: '1600x1600px'
    }), { labelText: 'Artwork', inputName: 'artwork' })

    const albumArtistInput = renderField(input({
      type: 'text',
      name: 'albumArtist',
      invalid: errors.albumArtist && !pristine.albumArtist,
      value: values.albumArtist,
      onchange: (e) => {
        this.validator.validate(e.target.name, e.target.value)
        this.rerender()
      }
    }), {
      labelText: 'Album artist',
      inputName: 'artwork',
      helpText: 'This may or may not be the same as your profile name.',
      errors: true
    })

    const releaseTitleInput = renderField(input({
      type: 'text',
      name: 'releaseTitle',
      invalid: errors.releaseTitle && !pristine.releaseTitle,
      value: values.releaseTitle,
      onchange: (e) => {
        this.validator.validate(e.target.name, e.target.value)
        this.rerender()
      }
    }), {
      labelText: 'Release title',
      inputName: 'releaseTitle',
      helpText: 'The name of this release as you want it to appear publicly.',
      errors: true
    })

    const aboutTextarea = renderField(textarea({
      name: 'about',
      maxlength: 200,
      invalid: errors.about && !pristine.about,
      placeholder: '',
      required: false,
      text: values.about,
      onchange: (e) => {
        this.validator.validate(e.target.name, e.target.value)
        this.rerender()
      }
    }), {
      labelText: 'About',
      inputName: 'about',
      helpText: 'Tell us a bit about this record.'
    })

    const genreInput = renderField(this.state.cache(ItemsInput, 'genre-input').render({
      validator: this.validator,
      form: this.form,
      items: [],
      required: false,
      inputName: 'genres',
      placeholder: 'Genre'
    }), {
      labelText: 'Genres',
      inputName: 'genres',
      helpText: 'Help others discover your music.'
    })

    const composersInput = renderField(this.state.cache(ItemsInput, 'composers-input').render({
      validator: this.validator,
      form: this.form,
      items: [],
      required: true,
      inputName: 'composers',
      placeholder: 'Artist name'
    }), {
      labelText: 'Composers',
      inputName: 'performers',
      helpText: 'List the writers who composed this release.'
    })

    const performersInput = renderField(this.state.cache(ItemsInput, 'performers-input').render({
      validator: this.validator,
      form: this.form,
      items: [],
      required: true,
      inputName: 'performers',
      placeholder: 'Artist name'
    }), {
      labelText: 'Performers',
      inputName: 'performers',
      helpText: 'List additional performers featured on this release.'
    })

    const month = input({
      name: 'month',
      type: 'number',
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
      type: 'number',
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
      type: 'number',
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

    const submitButton = button({
      type: 'submit',
      prefix: 'bg-white ba bw b--dark-gray f5 b pv3 ph5 grow',
      text: 'Continue',
      style: 'none',
      size: 'none'
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

    function renderAlbumTypesInputs (items) {
      /* eslint-disable indent */

      return items.map(({ value, text }) => html`
        <div>
          <input
            type=radio
            name="releaseType"
            id=${value}
            checked=${self.local.albumType === value}
            value=${value}
            class="o-0"
            style="width:0;height:0;"
            onchange=${(e) => {
              self.local.albumType = e.target.value
              self.rerender()
            }}>

          <label class="flex justify-center items-center w-100 dim" for=${value}>
            <div class="flex w-100 flex-auto">
              <div class="flex items-center justify-center h1 w1 ba bw b--mid-gray">
                ${icon('circle', { class: 'icon icon--xxs fill-transparent' })}
              </div>
              <div class="flex items-center ph3 f5 lh-copy">
                ${text}
              </div>
            </div>
          </label>
        </div>
      `)
    }

    function renderField (inputComponent, options) {
      const { labelText, inputName, helpText, errors } = options

      return html`
        <div class="mb5">
          <label for=${inputName} class="f4 db mv2">${labelText}</label>
          ${helpText ? html`<p class="lh-copy f5">${helpText}</p>` : ''}
          ${inputComponent}
          ${errors ? html`<p class="lh-copy f5 red">${errors[inputName] && !pristine[inputName] ? errors[inputName].message : ''}</p>` : ''}
        </div>
      `
    }

    return html`
      <div class="flex flex-column pb6">
        ${messages(this.state, this.form)}

        <form novalidate onsubmit=${this.handleSubmit}>
          ${albumArtistInput}

          ${releaseTitleInput}

          ${uploadArtwork}

          ${aboutTextarea}

          ${genreInput}

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
              <p class="lh-copy f5 red">${errors.month && !pristine.month ? errors.month.message : ''}</p>
              <p class="lh-copy f5 red">${errors.day && !pristine.day ? errors.day.message : ''}</p>
              <p class="lh-copy f5 red">${errors.year && !pristine.year ? errors.year.message : ''}</p>
              <p class="lh-copy f5 red">${errors.releaseDate && !pristine.releaseDate ? errors.releaseDate.message : ''}</p>
            </fieldset>
          </div>

          <div class="mb5">
            <fieldset class="pa0 bn">
              <legend class="f4 db mb2">Album type</legend>
              <div class="flex">
                ${renderAlbumTypesInputs(albumTypes)}
              </div>
            </fieldset>
          </div>

          ${performersInput}

          ${composersInput}

          ${submitButton}
        </form>
      </div>
    `
  }

  load () {
    this.validator.field('albumArtist', (data) => {
      if (isEmpty(data)) return new Error('Album artist is required')
    })
    this.validator.field('about', { required: false }, (data) => {
      if (!isLength(data, { min: 0, max: 200 })) return new Error('Bio should be no more than 200 characters')
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
    return false
  }
}

module.exports = ReleaseForm
