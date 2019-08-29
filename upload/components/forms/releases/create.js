const html = require('choo/html')
const Component = require('choo/component')
const storage = require('localforage')
const input = require('@resonate/input-element')
const button = require('@resonate/button')
const textarea = require('@resonate/textarea-element')
const icon = require('@resonate/icon-element')
const messages = require('../messages')
const ImageUploader = require('../../image-uploader')
const isEqual = require('is-equal-shallow')

const isEmpty = require('validator/lib/isEmpty')
const isLength = require('validator/lib/isLength')
const isISO8601 = require('validator/lib/isISO8601')
const validateFormdata = require('validate-formdata')
const ItemsInput = require('../../tags-input')
const nanostate = require('nanostate')

const leftPad = require('left-pad')

const releaseTypes = [
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
    this.local.data = {}

    this.local.machine = nanostate.parallel({
      form: nanostate('idle', {
        idle: { submit: 'submitted' },
        submitted: { valid: 'data', invalid: 'error' },
        data: { reset: 'idle', submit: 'submitted' },
        error: { reset: 'idle', submit: 'submitted', invalid: 'error' }
      }),
      request: nanostate('idle', {
        idle: { start: 'loading' },
        loading: { resolve: 'data', reject: 'error' },
        data: { start: 'loading' },
        error: { start: 'loading', stop: 'idle' }
      }),
      loader: nanostate('off', {
        on: { toggle: 'off' },
        off: { toggle: 'on' }
      })
    })

    this.local.machine.on('form:reset', () => {
      this.validator = validateFormdata()
      this.form = this.validator.state
    })

    this.local.machine.on('request:start', () => {
      this.loaderTimeout = setTimeout(() => {
        this.local.machine.emit('loader:toggle')
      }, 300)
    })

    this.local.machine.on('request:resolve', () => {
      this.emit(this.state.events.PUSHSTATE, `/releases/${this.local.data.id}`)

      clearTimeout(this.loaderTimeout)
    })

    this.local.machine.on('form:valid', async () => {
      try {
        this.local.machine.emit('request:start')

        const response = await this.state.api.releases.create(this.local.data)

        this.local.data = response.data

        this.local.machine.emit('request:resolve')
      } catch (err) {
        this.local.machine.emit('request:reject')
      }
    })

    this.local.machine.on('form:invalid', () => {
      const invalidInput = document.querySelector('.invalid')
      invalidInput.focus({ preventScroll: false }) // focus to first invalid input
    })

    this.local.machine.on('form:submit', () => {
      const form = this.element.querySelector('form')

      for (const field of form.elements) {
        const isRequired = field.required
        const name = field.name || ''
        const value = field.value || ''

        if (isRequired) {
          this.validator.validate(name, value)
        }
      }

      this.rerender()

      if (this.form.valid) {
        return this.local.machine.emit('form:valid')
      }

      return this.local.machine.emit('form:invalid')
    })

    this.validator = validateFormdata()
    this.form = this.validator.state
  }

  createElement (props) {
    const self = this

    const pristine = this.form.pristine
    const errors = this.form.errors
    const values = this.form.values

    for (const [key, value] of Object.entries(this.local.data)) {
      if (!['tags', 'composers', 'performers'].includes(key)) {
        values[key] = value
      }
    }

    const uploadArtwork = renderField(this.state.cache(ImageUploader, 'upload-artwork').render({
      form: this.form,
      validator: this.validator,
      required: true,
      format: { width: 1600, height: 1600 },
      accept: 'image/jpeg,image/jpg,image/png',
      ratio: '1600x1600px'
    }), { labelText: 'Artwork', inputName: 'artwork' })

    const albumArtistInput = renderField(input({
      type: 'text',
      name: 'display_artist',
      invalid: errors.display_artist && !pristine.display_artist,
      value: values.display_artist,
      onchange: async (e) => {
        this.validator.validate(e.target.name, e.target.value)
        this.local.data[e.target.name] = e.target.value
        await storage.setItem('release', this.local.data)
        this.rerender()
      }
    }), {
      labelText: 'Album artist',
      inputName: 'display_artist',
      helpText: 'This may or may not be the same as your profile name.',
      displayErrors: true
    })

    const releaseTitleInput = renderField(input({
      type: 'text',
      name: 'title',
      invalid: errors.title && !pristine.title,
      value: values.title,
      onchange: async (e) => {
        this.validator.validate(e.target.name, e.target.value)
        this.local.data[e.target.name] = e.target.value
        await storage.setItem('release', this.local.data)
        this.rerender()
      }
    }), {
      labelText: 'Release title',
      inputName: 'title',
      helpText: 'The name of this release as you want it to appear publicly.',
      displayErrors: true
    })

    const aboutTextarea = renderField(textarea({
      name: 'about',
      maxlength: 200,
      invalid: errors.about && !pristine.about,
      placeholder: '',
      required: false,
      text: values.about,
      onchange: async (e) => {
        this.validator.validate(e.target.name, e.target.value)
        this.local.data[e.target.name] = e.target.value
        await storage.setItem('release', this.local.data)
        this.rerender()
      }
    }), {
      labelText: 'About',
      inputName: 'about',
      helpText: 'Tell us a bit about this record.',
      displayErrors: true
    })

    const genreInput = renderField(this.state.cache(ItemsInput, 'tags-input').render({
      validator: this.validator,
      form: this.form,
      items: this.local.data.tags || [],
      onchange: async items => {
        this.local.data.tags = items
        await storage.setItem('release', this.local.data)
      },
      required: false,
      inputName: 'tags',
      placeholder: 'Genre'
    }), {
      labelText: 'Genres',
      inputName: 'tags',
      helpText: 'Help others discover your music.'
    })

    const composersInput = renderField(this.state.cache(ItemsInput, 'composers-input').render({
      validator: this.validator,
      form: this.form,
      items: this.local.data.composers || [],
      onchange: async items => {
        this.local.data.composers = items
        await storage.setItem('release', this.local.data)
      },
      required: false,
      inputName: 'composers',
      placeholder: 'Artist name'
    }), {
      labelText: 'Composers',
      inputName: 'composers',
      helpText: 'List the writers who composed this release.'
    })

    const performersInput = renderField(this.state.cache(ItemsInput, 'performers-input').render({
      validator: this.validator,
      form: this.form,
      items: this.local.data.performers || [],
      onchange: async items => {
        this.local.data.performers = items
        await storage.setItem('release', this.local.data)
      },
      required: false,
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
      invalid: errors.month && !pristine.month,
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
      invalid: errors.day && !pristine.day,
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
      invalid: errors.year && !pristine.year,
      placeholder: 'YYYY',
      value: values.year,
      onchange: function (e) {
        const { name, value } = e.target

        return updateReleaseDate(name, value)
      }
    })

    const releaseDate = input({
      type: 'hidden',
      name: 'release_date',
      value: values.release_date
    })

    const submitButton = button({
      type: 'submit',
      prefix: 'bg-white ba bw b--dark-gray f5 b pv3 ph5 grow',
      text: 'Continue',
      style: 'none',
      size: 'none'
    })

    async function updateReleaseDate (name, value) {
      self.validator.validate(name, value)
      self.local.data[name] = value

      const { month, day, year } = values
      const releaseDate = [year, month, day].filter(Boolean)

      if (releaseDate.length === 3) {
        self.element.querySelector('input[name=release_date]').value = releaseDate.join('-')
        self.validator.validate('release_date', releaseDate.join('-'))
        self.local.data.release_date = releaseDate.join('-')
      }

      await storage.setItem('release', self.local.data)

      self.rerender()
    }

    function renderAlbumTypesInputs (items) {
      /* eslint-disable indent */

      return items.map(({ value, text }) => html`
        <div>
          <input
            type=radio
            name="type"
            id=${value}
            checked=${self.local.data.type === value}
            value=${value}
            class="o-0"
            style="width:0;height:0;"
            onchange=${async (e) => {
              self.local.data.type = e.target.value
              await storage.setItem('release', self.local.data)
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
      const { labelText, inputName, helpText, displayErrors } = options

      return html`
        <div class="mb5">
          <label for=${inputName} class="f4 db mv2">${labelText}</label>
          ${helpText ? html`<p class="lh-copy f5">${helpText}</p>` : ''}
          ${inputComponent}
          ${displayErrors ? html`<p class="lh-copy f5 red">${errors[inputName] && !pristine[inputName] ? errors[inputName].message : ''}</p>` : ''}
        </div>
      `
    }

    return html`
      <div class="flex flex-column pb6">
        ${messages(this.state, this.form)}

        <form novalidate onsubmit=${(e) => { e.preventDefault(); this.local.machine.emit('form:submit') }}>
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
              <p class="lh-copy f5 red">${errors.release_date && !pristine.release_date ? errors.release_date.message : ''}</p>
            </fieldset>
          </div>

          <div class="mb5">
            <fieldset class="pa0 bn">
              <legend class="f4 db mb2">Album type</legend>
              <div class="flex">
                ${renderAlbumTypesInputs(releaseTypes)}
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
    this.validator.field('display_artist', (data) => {
      if (isEmpty(data)) return new Error('Album artist is required')
    })
    this.validator.field('about', { required: false }, (data) => {
      if (!isLength(data, { min: 0, max: 200 })) return new Error('Bio should be no more than 200 characters')
    })
    this.validator.field('title', (data) => {
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
    this.validator.field('release_date', (data) => {
      if (isEmpty(data)) return new Error('Release date is required')
      if (!isISO8601(data, { strict: true })) return new Error('Release date is invalid')
    })
  }

  unload () {
    this.local.machine.emit('form:reset')
  }

  update (props) {
    if (!isEqual(props.data, this.local.data)) {
      this.local.data = Object.assign({}, props.data)
      return true
    }
    return false
  }
}

module.exports = ReleaseForm
