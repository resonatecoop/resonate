const html = require('choo/html')
const Component = require('choo/component')
const validateFormdata = require('validate-formdata')
const input = require('@resonate/input-element')
const button = require('@resonate/button')
const Nanobounce = require('nanobounce')
const nanobounce = Nanobounce()
const noop = () => {}

/*
 * Typeahead for input
 * Show a list of results in a dropdown as you type
 * @todo Fetch results from server
 */

class AutocompleteInput extends Component {
  constructor (name, state, emit) {
    super(name)

    this.emit = emit
    this.state = state

    this.addItem = this.addItem.bind(this)
    this.removeItem = this.removeItem.bind(this)

    this.results = ['Marie Reiter', 'AGF', 'FOXTRAP', 'Coldcut', 'Last Japan'] // for fuzzy search test

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
    this.title = props.title || ''
    this.eachItem = props.eachItem || noop
    this.eachItem = this.eachItem.bind(this)

    this.items = props.items || []
    this.placeholder = props.placeholder || ''

    const pristine = this.form.pristine
    const errors = this.form.errors
    const values = this.form.values
    const results = this.results.filter((item) => {
      if (!values.q) return false
      const string = item.toLowerCase()
      const val = values.q.toLowerCase()
      return string.includes(val)
    }).map((result, index) => {
      const selected = this.items.includes(result)
      const selectedClass = selected ? 'o-50' : 'o-100'
      return html`
        <li onclick=${(e) => this.addItem(result)} class="flex flex-auto items-center striped--near-white relative bb b--black-20 bw1">
          ${button({ disabled: !!selected, classList: selectedClass, iconName: 'add', iconSize: 'sm' })}
          <span class="${selectedClass}">
            ${result}
          </span>
        </li>
      `
    })

    const items = this.items.map((item, index) => {
      const btn = button({
        onClick: (e) => this.removeItem(index),
        classList: 'absolute right-0',
        iconName: 'close',
        iconSize: 'xs'
      })

      return html`
        <li class="flex items-center relative">
          ${this.eachItem(item, index)}
          ${btn}
        </li>
      `
    })

    const inputEl = input({
      type: 'text',
      name: 'q',
      value: values.q,
      placeholder: this.placeholder,
      onKeyUp: (e) => {
        if (e.key === 'Escape') {
          values.q = ''
          this.rerender()
        }
      },
      onInput: (e) => {
        const value = e.target.value
        values.q = value
        nanobounce(() => {
          this.rerender()
        })
      },
      onchange: (e) => {
        this.validator.validate(e.target.name, e.target.value)
        this.rerender()
      }
    })

    return html`
      <div class="flex flex-column">
        <div class="relative">
          <div class="relative">
            ${inputEl}
          </div>
          <ul style="display:${results.length ? 'block' : 'none'}" class="absolute z-1 w-100 bg-white flex flex-column list ma0 pa0 bl bt br b--black-20 bw1">
            ${results}
          </ul>
          <h5 class="f5 b">${this.title}</h5>
          <ul class="list ma0 pa0">
            ${items}
          </ul>
        </div>
        <p class="ma0 pa0 message warning">
          ${errors.q && !pristine.q ? errors.q.message : ''}
        </p>
      </div>
    `
  }

  load () {
    this.validator.field('q', { required: false })
  }

  addItem (value, error) {
    if (value && !this.items.includes(value) && !error) {
      this.items.push(value)
      this.form.values.q = '' // clear
      this.rerender()
    }
  }

  removeItem (index) {
    if (index > -1) {
      this.items.splice(index, 1)
      this.rerender()
    }
  }

  update () {
    return false
  }
}

module.exports = AutocompleteInput
