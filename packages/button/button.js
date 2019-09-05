const html = require('nanohtml')
const icon = require('@resonate/icon-element')
const { iconFill: defaultIconFill, foreground } = require('@resonate/theme-skins')
const classNames = require('classnames')

function Button (props = {}) {
  const {
    prefix,
    disabled = false,
    iconName,
    iconFill = defaultIconFill,
    iconSize = 'sm',
    text
  } = props

  const buttonType = props.style || 'default'

  const style = {
    default: `${foreground} b--black ba bw b pv2 ph4`,
    blank: 'bg-transparent bn'
  }[buttonType]

  const small = props.size === 'small'

  let medium = false

  if (!props.size || props.size === 'medium') {
    medium = true
  }

  const attrs = {
    onclick: props.onClick || null,
    value: props.value || '',
    type: props.type || 'button',
    disabled: disabled || false,
    class: classNames(prefix, style, {
      'flex-shrink-0': true,
      f5: true,
      btn: true,
      grow: !disabled,
      'o-50': disabled,
      w2: small,
      h2: small,
      w3: medium,
      h3: medium
    })
  }

  const innerBtnClass = classNames('flex', 'items-center', { 'justify-center': !text })

  return html`
    <button ${attrs}>
      <div class=${innerBtnClass}>
        ${iconName ? icon(iconName, { class: iconFill, size: iconSize }) : ''}
        ${text ? html`<span class=${iconName ? 'pl2' : ''}>${text}</span>` : ''}
      </div>
    </button>
  `
}

module.exports = Button
