/**
 * Author: Jon Gunderson, Ku Ja Eun, Nicholas Hoyt and Brian Loh
 *
 * @desc
 *    Menu button component based on Menubutton.js at w3.org
 *
 * @link https://www.w3.org/TR/2016/WD-wai-aria-practices-1.1-20161214/examples/menu-button/menu-button-1/menu-button-1.html
 * @link https://www.w3.org/TR/2016/WD-wai-aria-practices-1.1-20161214/examples/menu-button/menu-button-1/js/Menubutton.js
 *
 */

const assert = require('assert')
const Nanocomponent = require('nanocomponent')
const PopupMenuAction = require('./lib/PopupMenuAction.js')
const button = require('@resonate/button')

function makeID () {
  return Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1)
}

class MenuButton extends Nanocomponent {
  constructor (name, state, emit) {
    super(name)

    this.popupMenu = false
    this.hasFocus = false
    this.hasHover = false
    this.flag = false

    this.keyCode = Object.freeze({
      TAB: 9,
      RETURN: 13,
      ESC: 27,
      SPACE: 32,
      PAGEUP: 33,
      PAGEDOWN: 34,
      END: 35,
      HOME: 36,
      LEFT: 37,
      UP: 38,
      RIGHT: 39,
      DOWN: 40
    })

    this.id = makeID()
  }

  createElement (props) {
    assert.strictEqual(typeof props, 'object', 'props should be an object')

    this.hover = props.hover
    this.items = props.items || []
    this.updateLastAction = props.updateLastAction
    this.orientation = props.orientation // menu orientation
    this.caret = props.caret === true

    return button({
      id: props.id,
      style: props.style,
      size: props.size,
      text: props.text,
      iconName: props.iconName
    })
  }

  beforerender (el) {
    el.setAttribute('aria-controls', `menu-${this.id}`)
    el.setAttribute('aria-haspopup', 'true')
    el.setAttribute('aria-expanded', 'false')

    el.addEventListener('keydown', this.handleKeydown.bind(this))
    el.addEventListener('click', this.handleClick.bind(this))
    el.addEventListener('focus', this.handleFocus.bind(this))
    el.addEventListener('blur', this.handleBlur.bind(this))

    if (this.hover === true) {
      el.addEventListener('mouseover', this.handleMouseover.bind(this))
      el.addEventListener('mouseout', this.handleMouseout.bind(this))
    }
  }

  load (el) {
    this.popupMenu = PopupMenuAction(this)

    if (el.parentNode) {
      el.parentNode.insertBefore(
        this.popupMenu.render({
          orientation: this.orientation || 'bottom',
          caret: this.caret
        }),
        this.element.nextSibling
      )
    }
  }

  unload (el) {
    const popupMenu = document.getElementById(el.getAttribute('aria-controls'))
    if (popupMenu) popupMenu.parentNode.removeChild(popupMenu)
  }

  handleKeydown (event) {
    switch (event.keyCode) {
      case this.keyCode.SPACE:
      case this.keyCode.RETURN:
      case this.keyCode.DOWN:
        if (this.popupMenu) {
          this.popupMenu.open()
          this.popupMenu.setFocusToFirstItem()
        }
        this.flag = true
        break

      case this.keyCode.UP:
        if (this.popupMenu) {
          this.popupMenu.open()
          this.popupMenu.setFocusToLastItem()
          this.flag = true
        }
        break

      default:
        break
    }

    if (this.flag) {
      event.stopPropagation()
      event.preventDefault()
    }
  }

  handleClick (event) {
    if (this.element.getAttribute('aria-expanded') === 'true') {
      this.popupMenu.close(true)
    } else {
      this.popupMenu.open()
      this.popupMenu.setFocusToFirstItem()
    }
  }

  handleFocus (event) {
    this.popupMenu.hasFocus = true
  }

  handleBlur (event) {
    this.popupMenu.hasFocus = false
    setTimeout(this.popupMenu.close.bind(this.popupMenu, false), 0)
  }

  handleMouseover (event) {
    this.hasHover = true
    this.popupMenu.open()
  }

  handleMouseout (event) {
    this.hasHover = false
    setTimeout(this.popupMenu.close.bind(this.popupMenu, false), 300)
  }

  update () {
    return false
  }
}

module.exports = MenuButton
