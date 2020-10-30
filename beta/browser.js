// browser only code

const plugins = require('@resonate/choo-plugins')

module.exports = (app) => {
  require('web-animations-js/web-animations.min') // required for @resonate/dialog-component

  window.localStorage.DISABLE_NANOTIMING = process.env.DISABLE_NANOTIMING === 'yes'
  window.localStorage.logLevel = process.env.LOG_LEVEL

  if (process.env.NODE_ENV !== 'production') {
    app.use(require('choo-devtools')())
    app.use(require('choo-service-worker/clear')())
  }

  app.use(require('choo-service-worker')('/sw.js', { scope: '/' }))

  if ('Notification' in window) {
    app.use(require('choo-notification')())
  }

  app.use(plugins.theme())
  app.use(plugins.tabbing())
  app.use(plugins.offlineDetect())
  app.use(require('./plugins/onResize')())
  app.use(plugins.visibility())
}
