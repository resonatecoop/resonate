const html = require('choo/html')
const Component = require('choo/component')
const validateFormdata = require('validate-formdata')
const input = require('@resonate/input-element')
const icon = require('icon-element')
const isURL = require('validator/lib/isURL')
const button = require('@resonate/button')

class LinksInput extends Component {
  constructor (name, state, emit) {
    super(name)

    this.emit = emit
    this.state = state

    this.removeLink = this.removeLink.bind(this)
    this.addLink = this.addLink.bind(this)
    this.links = []

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

    const pristine = this.form.pristine
    const errors = this.form.errors
    const values = this.form.values
    const links = this.links.map((link, index) => {
      const btn = button({
        onClick: (e) => this.removeLink(index),
        classList: 'bg-transparent bn absolute right-0 grow',
        iconName: 'close',
        iconSize: 'xs'
      })

      return html`
        <li class="flex items-center relative">
          ${link}
          ${btn}
        </li>
      `
    })

    const inputEl = input({
      type: 'url',
      name: 'link',
      invalid: errors.link && !pristine.link,
      required: false,
      placeholder: 'URL',
      value: values.link,
      onchange: (e) => {
        this.validator.validate(e.target.name, e.target.value)
        this.rerender()
      }
    })

    return html`
      <div class="flex flex-column">
        <p>Instagram, Twitter, Mastadon etc.</p>
        <div class="flex items-center mb1">
          ${inputEl}
          <button style="border-color:#7A7E80;" class="db h-100 bg-white bw b--black-20 h-100 ml1 pa2 grow" onclick=${(e) => this.addLink(values.link, errors.link)}>
            <div class="flex items-center">
              ${icon('add', { 'class': 'icon icon--sm' })}
            </div>
          </button>
        </div>

        <p class="ma0 pa0 message warning">
          ${errors.link && !pristine.link ? errors.link.message : ''}
        </p>

        ${links.length ? html`
          <div>
            <h4 class="f4">Your links</h4>

            <ul class="list ma0 pa0">
              ${links}
            </ul>
          </div>` : ''}
      </div>
    `
  }

  removeLink (index) {
    if (index > -1) {
      this.links.splice(index, 1)
      this.rerender()
    }
  }

  addLink (value, error) {
    if (value && !this.links.includes(value) && !error) {
      this.links.push(value)
      this.rerender()
    }
  }

  load () {
    this.validator.field('link', { required: false }, (data) => {
      if (!isURL(data, { require_protocol: false })) { return new Error('Link is not valid url') }
    })
  }

  update () {
    return false
  }
}

module.exports = LinksInput
