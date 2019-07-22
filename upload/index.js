const lazy = require('choo-lazy-view')
const html = require('choo/html')
const Layout = require('./elements/layout')
const choo = require('choo')

const app = choo()

if (process.env.NODE_ENV !== 'production') {
  app.use(require('choo-devtools')())
}

app.use(require('choo-meta')())
app.use(lazy)
app.use(require('./stores/app')())

app.route('/', Layout(require('./views/main')))
app.route('/releases', lazy(() => import('./views/releases')))
app.route('/*', lazy(() => import('./views/404')))

module.exports = app.mount('#app')
