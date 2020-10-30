// bankai only entry point

require('babel-polyfill')

const css = require('sheetify')
const { isBrowser } = require('browser-or-node')
const choo = require('choo')

css('./index.css')

const app = choo()
app.use(require('choo-meta')())

if (isBrowser) {
  require('./browser')(app)
}

require('./stores/index.js')(app)
require('./routes')(app)

module.exports = app.mount('#app')
