const html = require('choo/html')
const button = require('@resonate/button')
const viewLayout = require('../../layouts/default')

module.exports = () => viewLayout(renderSettings)

function renderSettings (state, emit) {
  const enableNotificationButton = button({
    disabled: state.notification.permission,
    onClick: (e) => emit('notification:request'),
    outline: true,
    text: state.notification.permission ? 'Enabled' : 'Enable',
    size: 'none'
  })

  const cookiesOptions = button({
    onClick: (e) => emit('cookies:consent'),
    outline: true,
    text: 'Update',
    size: 'none'
  })

  const appInstallButton = button({
    onClick: (e) => emit('pwa:install'),
    id: 'app-install',
    outline: true,
    text: 'Install PWA',
    size: 'none'
  })
  return html`
    <section id="app-settings" class="flex flex-column ph4 mt3">
      <div class="bg-light-gray bg-light-gray--light bg-transparent--dark ba b--gray b--gray--light b--near-black--dark mb3 pa3">
        <fieldset class="pa0 ma0 bn">
          <legend class="f3 lh-title ma0 pa0">Notifications</legend>
          <div class="mt2 mb4">
            <label for="notify" class="f5 lh-copy db mb2 required">${!state.notification.permission ? 'Native notifications are disabled' : 'Native notifications are enabled. To change this configuration, update your site settings for ' + process.env.APP_DOMAIN}.</label>
            ${enableNotificationButton}
          </div>
        </fieldset>
      </div>
      <div class="bg-light-gray bg-light-gray--light bg-transparent--dark ba b--gray b--gray--light b--near-black--dark mb3 pa3">
        <fieldset class="pa0 ma0 bn">
          <legend class="f3 lh-title ma0">Cookie consent</legend>
          <div class="mt2 mb4">
            <label for="cache" class="f5 lh-copy db mb2 required">${state.cookieConsentStatus === 'allow' ? 'Cookies are allowed' : 'Cookies are disabled'}</label>
            ${cookiesOptions}
          </div>
        </fieldset>
      </div>
      <div class="bg-light-gray bg-light-gray--light bg-transparent--dark ba b--gray b--gray--light b--near-black--dark mb3 pa3">
        <fieldset class="pa0 ma0 bn">
          <legend class="f3 lh-title ma0">Install PWA</legend>
          <div class="mt2 mb4">
            <label for="app-install" class="f5 lh-copy db mb2 required">${state.deferredPrompt === null ? 'App installed' : 'PWA does not seem to be installed'}</label>
            ${appInstallButton}
          </div>
        </fieldset>
      </div>
    </section>
  `
}
