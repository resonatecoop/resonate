const html = require('nanohtml')

module.exports = (props) => {
  const noop = () => {}
  const {
    text,
    invalid = false,
    maxlength = 200,
    autofocus = false,
    id = props.name || props.type, name,
    onchange = noop,
    placeholder,
    autocomplete = false,
    required = 'required'
  } = props

  return html`
    <textarea
      maxlength=${maxlength}
      autofocus=${autofocus}
      class="w-100 db bn bg-black white pa2 ma0 ba bw1 ${invalid ? 'invalid' : 'valid'}"
      onchange=${onchange}
      autocomplete=${autocomplete}
      id=${id}
      name=${name}
      placeholder=${placeholder}
      required=${required}>${text}</textarea>
  `
}
