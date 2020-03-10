const { isBrowser } = require('browser-or-node')
const lazy = require('choo-lazy-view')
const choo = require('choo')
const plugins = require('@resonate/choo-plugins')
const Layout = require('./elements/layout')

const app = choo()

app.use(lazy)
app.use(require('choo-meta')())

if (isBrowser) {
  require('web-animations-js/web-animations.min')

  window.localStorage.DISABLE_NANOTIMING = process.env.DISABLE_NANOTIMING === 'yes'
  window.localStorage.logLevel = process.env.LOG_LEVEL

  if (process.env.NODE_ENV !== 'production') {
    app.use(require('choo-devtools')())
    app.use(require('choo-service-worker/clear')())
  }

  app.use(require('choo-service-worker')('/sw.js', { scope: '/' }))
  app.use(require('choo-meta')())

  if ('Notification' in window) {
    app.use(require('choo-notification')())
  }

  app.use(plugins.theme())
  app.use(plugins.tabbing())
  app.use(plugins.offlineDetect())
  app.use(require('./plugins/onResize')())
}

app.use(plugins.visibility())
app.use(require('./stores/update')())
app.use(require('./stores/notifications')())
app.use(require('./stores/app')())
app.use(require('./stores/labels')())
app.use(require('./stores/artists')())
app.use(require('./stores/tracks')())
app.use(require('./stores/consent')())
app.use(require('./stores/player')())
app.use(require('./stores/search')())

app.route('/', Layout(require('./views/dashboard')))
app.route('/playlist/:type', Layout(require('./views/playlist')))
app.route('/artists', lazy(() => import('./views/artists')))
app.route('/artists/:uid', Layout(require('./views/artists/show')))
app.route('/artists/:uid/albums', Layout(require('./views/artists/albums')))
app.route('/artists/:uid/tracks', Layout(require('./views/artists/tracks')))
app.route('/artists/:uid/:tab', Layout(require('./views/artists/show')))
app.route('/labels', Layout(require('./views/labels/list')))
app.route('/labels/:uid/albums', Layout(require('./views/labels/albums')))
app.route('/labels/:uid/artists', Layout(require('./views/labels/artists')))
app.route('/labels/:uid', Layout(require('./views/labels/show')))
app.route('/labels/:uid/:tab', Layout(require('./views/labels/show')))
app.route('/tracks/:id', Layout(require('./views/tracks/show')))
app.route('/login', Layout(require('./views/login')))
app.route('/search/:q', Layout(require('./views/search')))
app.route('/search/:q/:tab', Layout(require('./views/search')))
app.route('/account', Layout(require('./views/profile/show')))
app.route('/library/:type', Layout(require('./views/playlist')))
app.route('/:user/library/:type', Layout(require('./views/playlist')))
app.route('/:user/*', lazy(() => import('./views/404')))

module.exports = app.mount('#app')
