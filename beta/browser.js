/* global localStorage */

const { isBrowser } = require('browser-or-node')
const plugins = require('@resonate/choo-plugins')

module.exports = (app) => {
  if (!isBrowser) return

  if (localStorage !== null) {
    localStorage.DISABLE_NANOTIMING = process.env.DISABLE_NANOTIMING === 'yes'
    localStorage.logLevel = process.env.LOG_LEVEL
  }

  if (process.env.NODE_ENV !== 'production' && localStorage !== null) {
    app.use(require('choo-devtools')())
  }

  if (process.env.NODE_ENV !== 'production') {
    app.use(require('choo-service-worker/clear')())
  }

  app.use(require('choo-service-worker')('/sw.js', { scope: '/' }))

  if ('Notification' in window) {
    app.use(require('choo-notification')())
  }

  app.use(require('./stores/pwa')())
  app.use(plugins.theme())
  app.use(plugins.tabbing())
  app.use(plugins.offlineDetect())
  app.use(plugins.visibility())
}
