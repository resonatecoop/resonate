const Dialog = require('@resonate/dialog-component')
const html = require('choo/html')
const { isBrowser } = require('browser-or-node')

const ACTION_KEY = 'j'

module.exports = () => {
  return (state, emitter) => {
    if (!isBrowser) return

    let active

    emitter.on(state.events.DOMCONTENTLOADED, () => {
      document.addEventListener('keydown', (event) => {
        if (event.metaKey && !active) {
          document.addEventListener('keydown', onKeyDown)
          document.addEventListener('keyup', onKeyUp)
        }
      })
    })

    function onKeyUp () {
      document.removeEventListener('keydown', onKeyDown)
      document.removeEventListener('keyup', onKeyUp)
    }

    function onKeyDown (event) {
      if (event.key === ACTION_KEY) {
        active = true
        openCommandDialog()
      }
      document.removeEventListener('keydown', onKeyDown)
    }

    function openCommandDialog () {
      const dialog = state.cache(Dialog, 'command-dialog')

      const dialogEl = dialog.render({
        prefix: 'dialog-default dialog--sm',
        content: html`
          <div class="flex flex-column">
              Filter things
          </div>
        `,
        onClose: function (e) {
          active = false
          dialog.destroy()
        }
      })

      document.body.appendChild(dialogEl)
    }
  }
}
