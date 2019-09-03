const Dialog = require('@resonate/dialog-component')
const cookies = require('browser-cookies')
const { isBrowser } = require('browser-or-node')
const COOKIE_DOMAIN = process.env.COOKIE_DOMAIN || '.resonate.is'
const button = require('@resonate/button')
const html = require('choo/html')

module.exports = () => {
  return (state, emitter) => {
    if (!isBrowser) return

    const status = cookies.get('cookieconsent_status')
    state.cookieConsentStatus = status

    emitter.on(state.events.DOMCONTENTLOADED, () => {
      if (!status) {
        openDialog()
      }

      emitter.on('cookies:openDialog', () => openDialog())

      emitter.on('cookies:setStatus', (status) => {
        state.cookieConsentStatus = status || state.cookieConsentStatus
        if (!state.cookieConsentStatus) return

        cookies.set('cookieconsent_status', state.cookieConsentStatus, { secure: true, expires: 365, domain: COOKIE_DOMAIN })

        emitter.emit('notify', {
          host: document.body,
          message: state.cookieConsentStatus === 'allow' ? 'Cookies are allowed' : 'Cookies are disabled'
        })

        emitter.emit(state.events.RENDER)
      })
    })

    function openDialog () {
      const dialogEl = state.cache(Dialog, 'consent-dialog').render({
        prefix: 'dialog-bottom h3-l bg-white black',
        content: html`
          <div class="flex flex-column flex-row-l items-center-l pv2">
            <div class="flex items-center flex-auto">
              <p class="lh-copy pl3">To ensure you get the best experience <b>beta.resonate.is</b> uses cookies. <a href="https://resonate.is/cookie-policy" target="_blank" rel="noopener">Learn more</a>.</p>
            </div>
            <div class="flex flex-auto items-center justify-end">
              <div class="mr3">
                ${button({ size: 'none', type: 'submit', value: 'decline', text: 'Decline' })}
              </div>
              <div class="mr4">
                ${button({ size: 'none', type: 'submit', value: 'allow', text: 'Allow cookies' })}
              </div>
            </div>
          </div>
        `,
        onClose: function (e) {
          emitter.emit('cookies:setStatus', e.target.value || e.target.returnValue)
          this.destroy()
        }
      })

      document.body.appendChild(dialogEl)
    }
  }
}
