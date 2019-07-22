const html = require('choo/html')
const Component = require('choo/component')
const nanostate = require('nanostate')
const API = require('../../lib/resonate-api')
const promiseTry = require('es6-promise-try')
const wrap = require('wrap-nanocomponent')
const form = wrap(require('./generic'))
const isEmail = require('validator/lib/isEmail')
const isEmpty = require('validator/lib/isEmpty')
const isLength = require('validator/lib/isLength')
const equals = require('validator/lib/equals')
const validateFormdata = require('validate-formdata')

class Signup extends Component {
  constructor (name, state, emit) {
    super(name)

    this.emit = emit
    this.state = state

    this.machine = nanostate('idle', {
      idle: { start: 'loading' },
      loading: { resolve: 'data', reject: 'error' },
      data: { start: 'loading' },
      error: { start: 'loading' }
    })

    this.machine.on('loading', () => {
      console.log('loading')
      this.rerender()
    })

    this.machine.on('data', () => {
      this.emit('render')
    })

    this.machine.on('error', () => {
      this.rerender()
    })

    this.submit = this.submit.bind(this)

    this.validator = validateFormdata()
    this.form = this.validator.state
  }

  createElement (props) {
    return html`
      <div class="flex flex-auto">
        ${form('signup-form', this.state, this.emit).render({
          id: 'signup',
          method: 'POST',
          action: '/signup',
          buttonText: 'Sign Up',
          validate: (props) => {
            this.validator.validate(props.name, props.value)
            this.rerender()
          },
          form: this.form || {
            changed: false,
            valid: true,
            pristine: {},
            required: {},
            values: {},
            errors: {}
          },
          fields: [
            { type: 'text', name: 'username', placeholder: 'Username' },
            { type: 'email', placeholder: 'Email' },
            { type: 'text', name: 'fullName', placeholder: 'Full name' },
            { type: 'password', placeholder: 'Password' },
            { type: 'password', name: 'confirmPassword', placeholder: 'Confirm Password' }
          ],
          submit: this.submit
        })}
      </div>
    `
  }

  submit (data) {
    const self = this

    const email = data.email.value
    const password = data.password.value

    const api = API.init({ user: this.state.user, version: 'v1' })

    self.machine.emit('start')

    return promiseTry(() => {
      return api.auth.signup(email, password)
    }).then(response => {
      if (response.data) {

      }
    }).then(() => {
      self.machine.emit('resolve')
    }).finally(() => {
      this.emit(this.state.events.PUSHSTATE, '/welcome')
      console.log('done')
    }).catch(err => {
      self.machine.emit('reject')
      console.log(err)
    })
  }

  load () {
    this.validator.field('email', (data) => {
      if (isEmpty(data)) return new Error('Email is required')
      if (!(isEmail(data))) return new Error('Email is not valid')
    })

    this.validator.field('username', (data) => {
      if (isEmpty(data)) return new Error('Username is required')
    })

    this.validator.field('fullName', (data) => {
      if (isEmpty(data)) return new Error('Full name is required')
    })

    this.validator.field('password', (data) => {
      if (isEmpty(data)) return new Error('Password is required')
      if (!isLength(data, { min: 6 })) return new Error('Password length should be at least 6 characters')
    })

    this.validator.field('confirmPassword', (data) => {
      if (isEmpty(data)) return new Error('Confirm password is required')
      if (!equals(data, this.form.values.password)) return new Error('Confirm password should be equal to password')
    })
  }

  update () {
    return false
  }
}

module.exports = (name, state, emit) => {
  if (!(this instanceof Signup)) return new Signup(name, state, emit)
}
