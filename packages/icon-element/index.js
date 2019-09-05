const html = require('nanohtml')
const assert = require('assert')
const classNames = require('classnames')

module.exports = iconElement

function iconElement (iconName, opts = {}) {
  assert.strictEqual(typeof iconName, 'string', 'elements/icon: iconName should be type string')
  assert.strictEqual(typeof opts, 'object', 'elements/icon: opts should be type object')

  const iconSize = opts.size || 'sm'

  const classes = classNames({
    icon: true,
    [`icon-${iconName}`]: true,
    [`icon--${iconSize}`]: true
  }, opts.class)

  return html`
    <svg viewBox="0 0 16 16" class="${classes}">
      <use xlink:href="#icon-${iconName}" />
    </svg>
  `
}
