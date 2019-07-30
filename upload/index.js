const lazy = require('choo-lazy-view')
const html = require('choo/html')
const Layout = require('./elements/layout')
const choo = require('choo')

const app = choo()

if (process.env.NODE_ENV !== 'production') {
  app.use(require('choo-devtools')())
}

app.use(lazy)
app.use(require('choo-meta')())
app.use(require('./stores/app')())
app.use(require('./stores/releases')())
app.use(require('./stores/tracks')())
app.use(require('./stores/artworks')())

app.route('/', Layout(require('./views/main')))
app.route('/releases', lazy(() => import('./views/releases')))
app.route('/releases/:id', lazy(() => import('./views/releases/item')))
app.route('/releases/:id/update', lazy(() => import('./views/releases/update')))
app.route('/releases/:id/tracks', lazy(() => import('./views/releases/tracks')))
app.route('/releases/:id/metadata', lazy(() => import('./views/releases/metadata')))
app.route('/tracks', lazy(() => import('./views/tracks')))
app.route('/artworks', lazy(() => import('./views/artworks')))
app.route('/*', lazy(() => import('./views/404')))

module.exports = app.mount('#app')
