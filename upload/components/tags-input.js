const html = require('choo/html')
const Component = require('choo/component')
const validateFormdata = require('validate-formdata')
const input = require('../elements/input')
const button = require('../elements/button')

class TagsInput extends Component {
  constructor (name, state, emit) {
    super(name)

    this.emit = emit
    this.state = state

    this.removeTag = this.removeTag.bind(this)
    this.addTag = this.addTag.bind(this)
    this.tags = []

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

    this.tags = props.tags || []

    const pristine = this.form.pristine
    const errors = this.form.errors
    const values = this.form.values
    const tags = this.tags.map((tag, index) => {
      return html`
        <li class="flex items-center bg-black-10 relative pv1 pl2 pr4 mr2 mb2">
          ${tag}
          ${button({ onClick: (e) => this.removeTag(index), classList: 'bg-transparent bn absolute right-1 grow', iconName: 'close-fat', iconSize: 'xs' })}
        </li>
      `
    })

    return html`
      <div class="flex flex-column">
        <div class="flex items-center mb1">
          ${input({
            type: 'text',
            name: 'tag',
            placeholder: 'Genre',
            value: values.tag,
            onchange: (e) => {
              this.validator.validate(e.target.name, e.target.value)
              this.rerender()
            }
          })}
          ${button({ onClick: (e) => this.addTag(values.tag, errors.tag), classList: 'db bg-white bw b--black-20 h-100 ml1 pa2 grow', iconName: 'add', iconSize: 'sm' })}
          <p class="pl2 grey">Optional</p>
        </div>

        <p class="ma0 pa0 message warning">
          ${errors.tag && !pristine.tag ? errors.tag.message : ''}
        </p>

        <ul class="flex flex-wrap list ma0 pa0 mt2">
          ${tags}
        </ul>
      </div>
    `
  }

  load () {
    this.validator.field('tag', (data) => {
      if (this.tags.includes(data)) return new Error('tag already exists')
    })
  }

  removeTag (index) {
    if (index > -1) {
      this.tags.splice(index, 1)
      this.rerender()
    }
  }

  addTag (value, error) {
    if (value && !this.tags.includes(value) && !error) {
      this.tags.push(value)
      this.rerender()
    }
  }

  update () {
    return false
  }
}

module.exports = (name, state, emit) => {
  if (!(this instanceof TagsInput)) return new TagsInput(name, state, emit)
}
