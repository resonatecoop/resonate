const html = require('choo/html')
const Component = require('choo/component')
const nanostate = require('nanostate')
const Form = require('./generic')
const isEmail = require('validator/lib/isEmail')
const isEmpty = require('validator/lib/isEmpty')
const validateFormdata = require('validate-formdata')
const storage = require('localforage')
const generateApi = require('../../lib/api')
const nanologger = require('nanologger')
const log = nanologger('login')
const cookies = require('browser-cookies')

class Login extends Component {
  constructor (name, state, emit) {
    super(name)

    this.emit = emit
    this.state = state

    this.machine = nanostate('idle', {
      idle: { start: 'loading' },
      loading: { resolve: 'idle', reject: 'error' },
      error: { start: 'loading' }
    })

    this.machine.on('loading', () => {
      this.rerender()
    })

    this.machine.on('error', () => {
      this.rerender()
    })

    this.sendRequest = this.sendRequest.bind(this)
    this.reset = this.reset.bind(this)

    this.validator = validateFormdata()
    this.form = this.validator.state
  }

  createElement (props) {
    const message = {
      'loading': html`<p class="status bg-gray bg--mid-gray--dark black w-100 pa2">Loading...</p>`,
      'error': html`<p class="status bg-yellow w-100 black pa1">Wrong email or password</p>`
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
        { type: 'password', placeholder: 'Password', help: html`<div class="flex justify-end"><a href="https://resonate.is/password-reset/" class="lightGrey f7 ma0 pt1 pr2" target="_blank" rel="noopener noreferer">Forgot your password?</a></div>` }
      ],
      submit: (data) => {
        const username = data.email.value // username is an email
        const password = data.password.value
        this.sendRequest(username, password)
      }
    })

    return html`
      <div class="flex flex-column flex-auto">
        ${message}
        ${form}
      </div>
    `
  }

  async sendRequest (username, password) {
    this.machine.emit('start')

    try {
      const response = await this.state.api.auth.login({
        username,
        password
      })

      if (!response.data) return this.machine.emit('reject')

      const { access_token: token, client_id: clientId, user } = response.data

      await Promise.all([
        storage.setItem('clientId', clientId),
        storage.setItem('user', user)
      ])

      this.state.user = Object.assign(this.state.user, user)
      this.state.api = generateApi({ token, clientId, user })

      const consent = cookies.get('cookieconsent_status')

      if (consent === 'allow') {
        await this.state.api.auth.tokens({ uid: user.uid, access_token: token })
      }

      log.info('Successfull login')

      this.machine.emit('resolve')

      this.reset()
      this.emit(this.state.events.PUSHSTATE, this.state.redirect ? this.state.redirect : '/')

      this.state.redirect = null
    } catch (err) {
      log.error(err)
      this.machine.emit('reject')
    }
  }

  unload () {
    this.reset()
  }

  reset () {
    this.validator = validateFormdata()
    this.form = this.validator.state
  }

  load () {
    this.validator.field('email', data => {
      if (isEmpty(data)) return new Error('Email is required')
      if (!(isEmail(data))) return new Error('Email is not valid')
    })

    this.validator.field('password', data => {
      if (isEmpty(data)) return new Error('Password is required')
    })
  }

  update () {
    return false
  }
}

module.exports = Login
