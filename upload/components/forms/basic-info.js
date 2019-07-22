const html = require('choo/html')
const Component = require('choo/component')
const nanostate = require('nanostate')
const icon = require('icon-element')
const isEmpty = require('validator/lib/isEmpty')
const isLength = require('validator/lib/isLength')
const validateFormdata = require('validate-formdata')

const input = require('../../elements/input')
const button = require('../../elements/button')
const textarea = require('../../elements/textarea')
const messages = require('./messages')

const wrap = require('wrap-nanocomponent')
const uploader = wrap(require('../uploader'))
const links = wrap(require('../links-input'))

const css = require('sheetify')
const subscribe = css`
  :host input[type="checkbox"] {
    opacity: 0;
    width: 0;
    height: 0;
  }
`

class BasicInfoForm extends Component {
  constructor (name, state, emit) {
    super(name)

    this.emit = emit
    this.state = state

    this.handleSubmit = this.handleSubmit.bind(this)

    this.machine = nanostate.parallel({
      subscription: nanostate('off', {
        on: { 'toggle': 'off' },
        off: { 'toggle': 'on' }
      })
    })

    this.machine.on('subscription:toggle', () => {
      this.rerender()
    })

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

    this.validator.validate('inputFile-profile-picture', {
      width: uploader('profile-picture', this.state, this.emit).width,
      height: uploader('profile-picture', this.state, this.emit).height
    })

    this.rerender()
    const invalidInput = document.querySelector('.invalid')
    if (invalidInput) invalidInput.focus({ preventScroll: false }) // focus to first invalid input

    if (this.form.valid) {
      this.emit(this.state.events.PUSHSTATE, {
        'artist': '/profile/artist-info',
        'label': '/profile/label-info'
      }[this.state.usergroup] || '/')
    }
  }

  createElement (props) {
    const pristine = this.form.pristine
    const errors = this.form.errors
    const values = this.form.values

    const subscribed = this.machine.state.subscription === 'on'

    return html`
      <div class="flex flex-column">
        ${messages(this.form)}
        <form novalidate onsubmit=${this.handleSubmit}>
          <div class="mb5">
            <div class="mb1">
              ${input({
                type: 'text',
                name: 'name',
                placeholder: 'Name',
                invalid: errors.name && !pristine.name,
                value: values.name,
                onchange: (e) => {
                  this.validator.validate(e.target.name, e.target.value)
                  this.rerender()
                }
              })}
            </div>
            <p class="ma0 pa0 message warning">${errors.name && !pristine.name ? errors.name.message : ''}</p>
            <p class="ma0 pa0 f5 grey">${!values.name || errors.name ? {
              'artist': 'Your artist name or nickname',
              'label': 'Your label name'
            }[this.state.usergroup] || 'Anything' : 'Awesome!'}</p>

          </div>

          <div class="mb5">
            <div class="mb1">
              ${textarea({
                name: 'bio',
                maxlength: 200,
                invalid: errors.bio && !pristine.bio,
                placeholder: 'Short bio',
                required: false,
                text: values.bio,
                onchange: (e) => {
                  this.validator.validate(e.target.name, e.target.value)
                  this.rerender()
                }
              })}
            </div>
            <p class="ma0 pa0 message warning">${errors.bio && !pristine.bio ? errors.bio.message : ''}</p>
            <p class="ma0 pa0 f5 grey">${values.bio ? 200 - values.bio.length : 200} characters remaining</p>
          </div>

          <div class="mb5">
            <label for="profile-picture" class="f4 db mv2">Profile picture</label>
            ${uploader('profile-picture', this.state, this.emit).render({
              form: this.form,
              validator: this.validator,
              required: true,
              format: { width: 176, height: 99 },
              accept: 'image/jpeg,image/jpg,image/png',
              ratio: '1600x900px'
            })}
          </div>

          <div class="mb5">
            <label for="header-image" class="f4 db mv2">Header image</label>
            ${uploader('header-image', this.state, this.emit).render({
              form: this.form,
              validator: this.validator,
              format: { width: 608, height: 147 },
              required: false,
              accept: 'image/jpeg,image/jpg,image/png',
              ratio: '2480x520px',
              direction: 'column'
            })}
          </div>

          <div class="mb5">
            <label for="location" class="f3 db mv2">Location</label>
            <div class="flex items-center mb1">
              ${input({
                type: 'text',
                name: 'location',
                invalid: errors.location && !pristine.location,
                placeholder: 'City',
                required: false,
                value: values.location,
                onchange: (e) => {
                  this.validator.validate(e.target.name, e.target.value)
                  this.rerender()
                }
              })}
              <p class="ma0 pa0 ph1 grey f6">Optional</p>
            </div>
            <p class="ma0 pa0 message warning">
              ${errors.location && !pristine.location ? errors.location.message : ''}
            </p>
            <p class="ma0 pa0 f5 grey">${!values.location || errors.location ? {
              'artist': 'Your artist location',
              'label': 'Your label location'
            }[this.state.usergroup] || 'Anything' : 'Awesome!'}</p>
          </div>

          <fieldset class="ma0 pa0 mb5 bn">
            <legend class="f4">Links <small>Optional</small></legend>

            ${links('links-input', this.state, this.emit).render({
              form: this.form,
              validator: this.validator,
              value: this.state.user ? this.state.user.location : ''
            })}
          </fieldset>

          <div class="${subscribe} mb5">
            <input onchange=${() => this.machine.emit('subscription:toggle')} id="subscribe" name="subscribe" type="checkbox" checked=${subscribed ? 'checked' : false}">
            <label for="subscribe" class="flex items-center">
              <div class="flex pa2 ba bw ${subscribed ? 'b--black' : 'b--black-40'}">
                ${icon('check', { 'class': subscribed ? 'icon icon--sm icon--black' : 'icon icon--sm icon--grey' })}
              </div>
              <span class="f4 ml2">
                Subscribe to newsletter
              </span>
            </label>
          </div>

          ${button({ type: 'submit', text: 'Continue' })}
        </form>
      </div>
    `
  }

  load () {
    this.validator.field('name', (data) => {
      if (isEmpty(data)) return new Error('Name is required')
    })
    this.validator.field('bio', { required: false }, (data) => {
      if (!isLength(data, { min: 0, max: 200 })) return new Error('Bio should be no more than 200 characters')
    })
    this.validator.field('location', { required: false }, (data) => {
      if (!(typeof data === 'string')) return new Error('Location should be a string')
    })
  }

  update () {
    return true
  }
}

module.exports = (name, state, emit) => {
  if (!(this instanceof BasicInfoForm)) return new BasicInfoForm(name, state, emit)
}
