const html = require('choo/html')
const Component = require('choo/component')
// const icon = require('@resonate/icon-element')
const button = require('@resonate/button')
const validateFormdata = require('validate-formdata')
const messages = require('../messages')
const TrackUploader = require('../../track-uploader')
const nanostate = require('nanostate')

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
    // const self = this

    const pristine = this.form.pristine
    const errors = this.form.errors
    // const values = this.form.values

    /*

    for (const [key, value] of Object.entries(this.local.data)) {
      if (!['tags', 'composers', 'performers'].includes(key)) {
        values[key] = value
      }
    }
    */

    const submitButton = button({
      type: 'submit',
      prefix: 'bg-white ba bw b--dark-gray f5 b pv3 ph5 grow',
      text: 'Continue',
      style: 'none',
      size: 'none'
    })

    const uploadTracks = renderField(this.state.cache(TrackUploader, 'upload-tracks').render({
      form: this.form,
      validator: this.validator,
      required: true,
      format: { width: 1600, height: 1600 },
      accept: 'image/jpeg,image/jpg,image/png',
      ratio: '1600x1600px'
    }), { labelText: 'Add tracks', inputName: 'tracks' })

    return html`
      <div class="flex flex-column pb6">
        ${messages(this.state, this.form)}

        <form novalidate onsubmit=${(e) => { e.preventDefault(); this.local.machine.emit('form:submit') }}>
          ${uploadTracks}


          ${submitButton}
        </form>
      </div>
    `

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
  }

  load () {

  }

  unload () {
    this.local.machine.emit('form:reset')
  }

  update (props) {
    return false
  }
}

module.exports = ReleaseForm
