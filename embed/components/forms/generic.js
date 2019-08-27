const html = require('choo/html')
const Component = require('choo/component')
const inputEl = require('@resonate/input-element')
const button = require('@resonate/button')
const icon = require('@resonate/icon-element')

class Form extends Component {
  constructor (name, state, emit) {
    super(name)

    this.emit = emit
    this.state = state

    this.handler = this.handler.bind(this)
  }

  handler (e) {
    e.preventDefault()

    for (const field of e.target.elements) {
      const isRequired = field.required
      const name = field.name || ''
      const value = field.value || ''
      if (isRequired) this.validate({ name, value })
    }

    this.rerender()

    if (this.form.valid) {
      this.submit(e.target)
    }
  }

  createElement (props) {
    this.fields = props.fields
    this.buttonText = props.buttonText || ''
    this.form = props.form
    this.id = props.id
    this.action = props.action
    this.method = props.method || 'POST'
    this.submit = props.submit
    this.validate = props.validate

    const pristine = this.form.pristine
    const errors = this.form.errors
    const values = this.form.values

    const inputs = this.fields.map(fieldProps => {
      const { name = fieldProps.type } = fieldProps
      const props = Object.assign(fieldProps, {
        onchange: (e) => {
          this.validate({ name: e.target.name, value: e.target.value })
          this.rerender()
        }
      })

      const info = html`<div class="absolute left-0 ph1 flex items-center" style="top:50%;transform: translate(-100%, -50%);">
          ${icon('info', { class: 'icon icon--red icon--sm' })}
        </div>`

      return html`
        <div class="flex flex-column">
          <div class="relative mb1">
            ${inputEl(Object.assign(props, { value: values[name] }))}
            ${errors[name] && !pristine[name] ? info : ''}
          </div>
            ${errors[name] && !pristine[name] ? html`<span class="message warning pb2">${errors[name].message}</span>` : ''}
        </div>
      `
    })

    const messages = Object.keys(errors).map((name) => {
      if (errors[name] && !pristine[name]) {
        return {
          message: errors[name].message,
          name
        }
      }
      return false
    }).filter(Boolean)

    return html`
      <div class="flex flex-column flex-auto">
        ${messages.length ? html`
        <div class="flex flex-column pa2 mb3 ba bw b--black-50">
          <h4 class="body-color f4 ma0">Something went wrong there...</h4>
          <h5 class="body-color f5 ma0 pv1">Please check the errors in the form and try again.</h5>
          <ul class="flex flex-column list ma0 pa0 ml3 error">
            ${messages.map(({ message, name }) => html`
              <li class="flex items-center pv1">
                ${icon('info', { class: 'icon icon--red icon--md' })}
                <a href="#${name}" class="ml1 link db underline">
                  ${message}
                </a>
              </li>
            `)}
          </ul>
        </div>` : ''}
        <form novalidate class="flex flex-column flex-auto ma0 pa0" id=${this.id} action=${this.action} method=${this.method} onsubmit=${this.handler}>
          ${inputs}
          <div class="flex mt3">
            ${button({ type: 'submit', text: this.buttonText })}
          </div>
        </form>
      </div>
    `
  }

  update () {
    return true
  }
}

module.exports = Form
