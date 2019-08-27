const CookieConsent = require('../components/cookie-consent')
const cookies = require('browser-cookies')
const { isBrowser } = require('browser-or-node')
const COOKIE_DOMAIN = process.env.COOKIE_DOMAIN || '.resonate.is'

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

        cookies.set('cookieconsent_status', state.cookieConsentStatus, { secure: true, expires: 365, domain: COOKIE_DOMAIN })

        emitter.emit('notify', {
          host: document.body,
          message: state.cookieConsentStatus === 'allow' ? 'Cookies are allowed' : 'Cookies are disabled'
        })

        emitter.emit(state.events.RENDER)
      })
    })

    function openDialog () {
      const cookieConsentEl = state.cache(CookieConsent, 'cookie-consent').render()
      document.body.appendChild(cookieConsentEl)
    }
  }
}
