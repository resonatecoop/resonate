const html = require('nanohtml')
const { foreground } = require('@resonate/theme-skins')
const classnames = require('classnames')

/**
 * Render <input/> element
 */

const inputEl = (props) => {
  const {
    autofocus = false,
    id = props.name || props.type,
    value = '',
    type = 'text',
    theme = 'auto',
    invalid = false,
    name = props.type,
    onchange = () => {},
    onKeyPress = () => {},
    onInput = () => {},
    onKeyUp = () => {},
    onKeyDown = () => {},
    placeholder = '',
    autocomplete = false,
    required = 'required'
  } = props

  const prefix = props.prefix || props.classList

  const attrs = {
    autofocus: autofocus,
    class: classnames(
      prefix,
      theme === 'dark' ? 'bg-black white' : foreground,
      'placeholder--dark-gray input-reset w-100 bn pa3',
      invalid ? 'invalid' : 'valid'
    ),
    value: value,
    onkeyup: onKeyUp,
    onkeypress: onKeyPress,
    onkeydown: onKeyDown,
    oninput: onInput,
    onchange: onchange,
    autocomplete: autocomplete,
    id: id,
    type: type,
    name: name,
    placeholder: placeholder,
    required: required
  }

  if (props.min && type === 'string') {
    attrs.minlength = props.min
  }
  if (props.max && type === 'string') {
    attrs.maxlength = props.max
  }

  return html`
    <input ${attrs}>
  `
}

module.exports = inputEl
