const html = require('choo/html')
const Component = require('choo/component')
const validateFormdata = require('validate-formdata')

const button = require('../../elements/button')

const wrap = require('wrap-nanocomponent')
const autocompleteInput = wrap(require('../autocomplete-input'))

class LabelInfoForm extends Component {
  constructor (name, state, emit) {
    super(name)

    this.emit = emit
    this.state = state

    this.handleSubmit = this.handleSubmit.bind(this)

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
    return html`
      <div class="flex flex-column">
        <form novalidate onsubmit=${this.handleSubmit}>
          <div class="mb5">
            <label for="your-artists" class="f4 db mv2">Your Artists</label>

            <p>Add the artists signed to your label. They’ll appear on your profile.</p>

            ${autocompleteInput('autocomplete-input-3', this.state, this.emit).render({
              form: this.form,
              validator: this.validator,
              placeholder: 'Artist name',
              title: 'Current artists',
              items: ['Augustin Godiscal', 'Marie Reiter', 'AGF'],
              eachItem: function (item, index) {
                return html`
                  <div>${item}</div>
                `
              }
            })}
          </div>

          ${button({ type: 'submit', text: 'Continue' })}
        </form>
      </div>
    `
  }

  load () {

  }

  update () {
    return true
  }
}

module.exports = (name, state, emit) => {
  if (!(this instanceof LabelInfoForm)) return new LabelInfoForm(name, state, emit)
}
