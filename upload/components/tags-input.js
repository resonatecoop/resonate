const html = require('choo/html')
const Component = require('choo/component')
const validateFormdata = require('validate-formdata')
const input = require('@resonate/input-element')
const isEmpty = require('validator/lib/isEmpty')
const button = require('@resonate/button')

class ItemsInput extends Component {
  constructor (id, state, emit) {
    super(id)

    this.emit = emit
    this.state = state
    this.local = state.components[id] = {}

    this.removeItem = this.removeItem.bind(this)
    this.addItem = this.addItem.bind(this)

    this.local.items = []

    this.validator = validateFormdata()
    this.form = this.validator.state
  }

  createElement (props) {
    this.validator = props.validator || this.validator
    this.form = props.form || this.form || {
      changed: false,
      valid: true,
      pristine: {},
      required: {},
      values: {},
      errors: {}
    }

    this.local.items = props.items || []
    this.local.inputName = props.inputName || 'tags'
    this.local.required = props.required
    this.local.placeholder = props.placeholder || ''

    const pristine = this.form.pristine
    const errors = this.form.errors
    const values = this.form.values
    const items = this.local.items.map((item, index) => {
      const _button = button({
        onClick: (e) => this.removeItem(index),
        prefix: 'bg-transparent bn absolute right-0 mr1 grow',
        iconName: 'close-fat',
        iconSize: 'xs',
        style: 'none',
        size: 'none'
      })
      return html`
        <li class="flex items-center bg-black-10 relative pv1 pl2 pr4 mr2 mb2">
          ${item}
          ${_button}
        </li>
      `
    })

    const _input = input({
      type: 'text',
      name: this.local.inputName,
      placeholder: this.local.placeholder,
      required: this.local.required,
      onKeyPress: (e) => {
        if (e.keyCode === 13) {
          e.preventDefault()
          this.validator.validate(e.target.name, e.target.value)
          this.rerender()
          this.addItem(values[this.local.inputName], errors[this.local.inputName])
        }
      },
      value: values[this.local.inputName],
      onchange: (e) => {
        this.validator.validate(e.target.name, e.target.value)
        this.rerender()
      }
    })

    const _button = button({
      onClick: (e) => this.addItem(values[this.local.inputName], errors[this.local.inputName]),
      prefix: 'db bg-white bw b--black-20 h-100 ml1 pa3 grow',
      style: 'none',
      size: 'none',
      iconName: 'add',
      iconSize: 'sm'
    })

    return html`
      <div class="flex flex-column">
        <div class="flex items-center mb1">
          ${_input}
          ${_button}
          ${!this.local.required ? html`<p class="lh-copy f5 pl2 grey">Optional</p>` : ''}
        </div>

        <p class="ma0 pa0 f5 lh-copy red">
          ${errors[this.local.inputName] && !pristine[this.local.inputName] ? errors[this.local.inputName].message : ''}
        </p>

        <ul class="flex flex-wrap list ma0 pa0 mt2">
          ${items}
        </ul>
      </div>
    `
  }

  load () {
    this.validator.field(this.local.inputName, { required: this.local.required }, (data) => {
      if (this.local.required && isEmpty(data)) {
        return new Error(`Adding ${this.local.inputName} is required`)
      }
      if (this.local.items.includes(data)) {
        return new Error('Item already exists')
      }
    })
  }

  removeItem (index) {
    if (index > -1) {
      this.local.items.splice(index, 1)
      this.rerender()
    }
  }

  addItem (value, error) {
    if (value && !this.local.items.includes(value) && !error) {
      this.local.items.push(value)
      this.rerender()
    }
  }

  update (props) {
    return props.form.changed
  }
}

module.exports = ItemsInput
