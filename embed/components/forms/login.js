const html = require('choo/html')
const Component = require('choo/component')
const nanostate = require('nanostate')
const Form = require('./generic')
const isEmail = require('validator/lib/isEmail')
const isEmpty = require('validator/lib/isEmpty')
const validateFormdata = require('validate-formdata')

class Login extends Component {
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
    const message = {
      loading: html`<p class="status bg-black-10 w-100 black pa1">Loading</p>`,
      error: html`<p class="status bg-yellow w-100 black pa1">Wrong login details</p>`
    }[this.machine.state]

    const form = this.state.cache(Form, 'login-form').render({
      id: 'login',
      method: 'POST',
      action: '/login',
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
      buttonText: 'Login',
      fields: [
        { type: 'email', autofocus: true, placeholder: 'Email' },
        { type: 'password', placeholder: 'Password' }
      ],
      submit: this.submit
    })

    return html`
      <div class="flex flex-column flex-auto">
        ${message}
        ${form}
      </div>
    `
  }

  submit (data) {
    const self = this

    const username = data.email.value // username is an email
    const password = data.password.value

    console.log(username, password)

    self.machine.emit('start')
  }

  load () {
    this.validator.field('email', function (data) {
      if (isEmpty(data)) return new Error('Email is required')
      if (!(isEmail(data))) return new Error('Email is not valid')
    })

    this.validator.field('password', function (data) {
      if (isEmpty(data)) return new Error('Password is required')
    })
  }

  update () {
    return false
  }
}

module.exports = Login
