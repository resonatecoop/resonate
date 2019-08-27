const html = require('nanohtml')
const icon = require('icon-element')
const { iconFill: defaultIconFill, foreground } = require('@resonate/theme-skins')

function Button (props) {
  const {
    value = '',
    prefix, // prefix for tachyons or class name list
    type = 'button',
    disabled = false,
    iconName,
    iconFill = defaultIconFill,
    iconSize = 'sm',
    onClick: clickHandler = () => {},
    text
  } = props

  const style = {
    default: `${foreground} flex-shrink-0 b--black ba bw b pv2 ph4 f5 ${!disabled ? 'grow' : 'o-50'}`,
    blank: `bg-transparent flex-shrink-0 bn f5 ${!disabled ? 'grow' : 'o-50'}`,
    none: ''
  }[props.style || 'default']

  const size = {
    none: '',
    small: 'w2 h2',
    medium: 'w3 h3'
  }[props.size || 'medium']

  const classList = [style, size, prefix]
    .filter(Boolean)
    .join(' ')

  return html`
    <button
      value=${value}
      type=${type}
      disabled=${disabled}
      class=${classList}
      onclick=${clickHandler}>
        <div class="flex items-center ${!text ? 'justify-center' : ''}">
          ${iconName ? icon(iconName, { class: `icon icon--${iconSize} ${iconFill}` }) : ''}
          ${text ? html`<span class=${iconName ? 'pl2' : ''}>${text}</span>` : ''}
        </div>
    </button>
  `
}

module.exports = Button
