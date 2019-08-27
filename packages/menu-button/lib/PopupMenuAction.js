/*
*   This content is licensed according to the W3C Software License at
*   https://www.w3.org/Consortium/Legal/2015/copyright-software-and-document
*
*   File:   PopupMenuAction.js
*
*   Desc:   Popup menu widget that implements ARIA Authoring Practices
*
*   Author: Jon Gunderson, Ku Ja Eun, Nicholas Hoyt and Brian Loh
*/

const Nanocomponent = require('nanocomponent')
const html = require('nanohtml')
const MenuItem = require('./MenuItemAction.js')
const animation = require('nanoanimation')
const button = require('@resonate/button')

/*
*   @constructor PopupMenuAction
*
*   @desc
*       Popup Menu Action component based on PopupMenuAction.js at w3.org
*
*   @link https://www.w3.org/TR/2016/WD-wai-aria-practices-1.1-20161214/examples/menu-button/menu-button-1/js/PopupMenuAction.js
*
*/

class PopupMenuAction extends Nanocomponent {
  constructor (menuButton) {
    super()

    this.controller = menuButton

    this.menuitems = []

    this.firstItem = null
    this.lastItem = null

    this.hasFocus = false
    this.hasHover = false
  }

  beforerender (el) {
    el.tabIndex = -1

    el.setAttribute('role', 'menu')

    if (!el.getAttribute('aria-labelledby') && !el.getAttribute('aria-label') && !el.getAttribute('title')) {
      const label = this.controller.element.innerHTML
      el.setAttribute('aria-label', label)
    }

    el.addEventListener('mouseover', this.handleMouseover.bind(this))
    el.addEventListener('mouseout', this.handleMouseout.bind(this))

    // Traverse the element children of domNode: configure each with
    // menuitem role behavior and store reference in menuitems array.
    const menuElements = [...el.querySelectorAll('li')]

    menuElements.forEach(menuElement => {
      const menuItem = new MenuItem(menuElement, this)
      menuItem.init()
      this.menuitems.push(menuItem)
    })

    // Use populated menuitems array to initialize firstItem and lastItem.
    const numItems = this.menuitems.length
    if (numItems > 0) {
      this.firstItem = this.menuitems[0]
      this.lastItem = this.menuitems[numItems - 1]
    }
  }

  createElement (props) {
    this.orientation = props.orientation
    this.caret = props.caret

    const classList = [
      'dropdown',
      'bg-white z-2 near-black b--light-gray bl bt br bw absolute dn list ma0 pa0',
      this.orientation,
      this.caret && 'caret'
    ]
      .filter(Boolean)
      .join(' ')

    return html`
      <ul style="min-width:180px;"
        class=${classList}
        id="menu-${this.controller.id}"
        role="menu"
        aria-labelledby="menubutton1">
        ${this.controller.items.map(({ text, iconName, imageUrl, actionName }) => html`
          <li class="bg-white hover-bg-light-gray black flex items-center pa2 f5 w-100 b--light-gray bw bb"
              role="menuitem"
              onclick=${(e) => this.controller.updateLastAction(actionName)}>
            ${button({ iconName, imageUrl, iconFill: 'fill-black', text, style: 'blank', size: 'none' })}
          </li>
        `)}
      </ul>
    `
  }

  update () {
    return false
  }

  /* EVENT HANDLERS */

  handleMouseover (event) {
    this.hasHover = true
  }

  handleMouseout (event) {
    this.hasHover = false
    setTimeout(this.close.bind(this, false), 300)
  }

  /* FOCUS MANAGEMENT METHODS */

  setFocusToController (command) {
    if (typeof command !== 'string') {
      command = ''
    }

    if (command === 'previous') {
      this.controller.menubutton.setFocusToPreviousItem(this.controller)
    } else {
      if (command === 'next') {
        this.controller.menubutton.setFocusToNextItem(this.controller)
      } else {
        this.controller.element.focus()
      }
    }
  }

  setFocusToFirstItem () {
    this.firstItem.domNode.focus()
  }

  setFocusToLastItem () {
    this.lastItem.domNode.focus()
  }

  setFocusToPreviousItem (currentItem) {
    if (currentItem === this.firstItem) {
      this.lastItem.domNode.focus()
    } else {
      const index = this.menuitems.indexOf(currentItem)
      this.menuitems[index - 1].domNode.focus()
    }
  }

  setFocusToNextItem (currentItem) {
    if (currentItem === this.lastItem) {
      this.firstItem.domNode.focus()
    } else {
      const index = this.menuitems.indexOf(currentItem)
      this.menuitems[index + 1].domNode.focus()
    }
  }

  /* MENU DISPLAY METHODS */

  open () {
    const animate = animation([
      { opacity: 0 },
      { opacity: 1 }
    ], {
      duration: 300,
      fill: 'forwards'
    })
    const move = animate(this.element)
    // get bounding rectangle of controller object's DOM node
    const rect = this.controller.element.getBoundingClientRect()

    // set CSS properties
    this.element.style.display = 'block'
    this.element.style.position = 'absolute'
    const offset = 10

    if (this.orientation === 'right') {
      this.element.style.left = (rect.width + offset) + 'px'
      this.element.style.top = '0px'
    }

    if (this.orientation === 'bottom') {
      this.element.style.top = (rect.height + offset) + 'px'
      this.element.style.left = '0px'
    }

    if (this.orientation === 'top') {
      this.element.style.bottom = (rect.height + offset) + 'px'
      this.element.style.left = '0px'
    }

    if (this.orientation === 'topright') {
      this.element.style.bottom = (rect.height + offset) + 'px'
      this.element.style.left = 'auto'
      this.element.style.right = '0px'
    }

    if (this.orientation === 'left') {
      this.element.style.left = '100%'
      this.element.style.transform = 'translateX(-100%)'
      this.element.style.top = '0px'
    }

    // set aria-expanded attribute
    this.controller.element.setAttribute('aria-expanded', 'true')

    move.play()
  }

  close (force) {
    if (!this.element) return
    if (typeof force !== 'boolean') {
      force = false
    }

    if (force || (!this.hasFocus && !this.hasHover && !this.controller.hasHover)) {
      this.element.style.display = 'none'
      this.controller.element.setAttribute('aria-expanded', 'false')
    }
  }
}

module.exports = (menuButton) => {
  if (!(this instanceof PopupMenuAction)) return new PopupMenuAction(menuButton)
}
