const html = require('nanohtml')
const { foreground } = require('@resonate/theme-skins')
const classnames = require('classnames')

/**
 * Render <input/> element
 */

const inputEl = (props) => {
  const {
    autofocus = false,
    events = {
      onkeyup: props.onKeyUp || props.onkeyup,
      onkeypress: props.onKeyPress || props.onkeypress,
      onkeydown: props.onKeyDown || props.onkeydown,
      oninput: props.onInput || props.oninput,
      onchange: props.onChange || props.onchange
    },
    id = props.name || props.type,
    value = '',
    type = 'text',
    theme = 'auto',
    invalid = false,
    name = props.type,
    placeholder = '',
    autocomplete = 'off',
    required = 'required'
  } = props

  const prefix = props.prefix || props.classList

  const attrs = Object.assign({
    autofocus: autofocus,
    autocomplete,
    class: classnames(
      prefix,
      theme === 'dark' ? 'bg-black white' : foreground,
      'placeholder--dark-gray input-reset w-100 bn pa3',
      invalid ? 'invalid' : 'valid'
    ),
    value: value,
    id: id,
    type: type,
    name: name,
    placeholder: placeholder,
    required: required
  }, events)

  if (props.min && type === 'text') {
    attrs.minlength = props.min
  }
  if (props.max && type === 'text') {
    attrs.maxlength = props.max
  }

  return html`
    <input ${attrs}>
  `
}

module.exports = inputEl
