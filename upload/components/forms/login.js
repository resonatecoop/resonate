const html = require('choo/html')
const Component = require('choo/component')
const nanostate = require('nanostate')
const storage = require('localforage')
const API = require('../../lib/resonate-api')
const promiseTry = require('es6-promise-try')
const wrap = require('wrap-nanocomponent')
const form = wrap(require('./generic'))
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
      'loading': html`<p class="status bg-black-10 w-100 black pa1">Loading</p>`,
      'error': html`<p class="status bg-yellow w-100 black pa1">Wrong login details</p>`
    }[this.machine.state]

    return html`
      <div class="flex flex-column flex-auto">
        ${message}
        ${form('login-form', this.state, this.emit).render({
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
        })}
      </div>
    `
  }

  submit (data) {
    const self = this

    const username = data.email.value // username is an email
    const password = data.password.value

    const api = API.init({ user: this.state.user, version: 'v1' })

    self.machine.emit('start')

    return promiseTry(() => {
      return api.auth.login(username, password)
    }).then(response => {
      if (response.data) {
        const accessToken = response.data.access_token
        const clientId = response.data.client_id
        const user = response.data.user
        if (!accessToken || !clientId || !user) return
        storage.setItem('accessToken', accessToken)
        storage.setItem('clientId', clientId)
        storage.setItem('user', response.data.user)
        self.state.user = user
        self.state.api = API.init({ user, accessToken, clientId, version: 'v1' })
        self.state.status = 'logged'
        self.emit('api:ready', { user, accessToken, clientId })
        self.emit(this.state.events.PUSHSTATE, '/')
      }
    }).then(() => {
      self.machine.emit('resolve')
    }).finally(() => {
      console.log('done')
    }).catch(err => {
      self.machine.emit('reject')
      console.debug(err)
    })
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

module.exports = (name, state, emit) => {
  if (!(this instanceof Login)) return new Login(name, state, emit)
}
