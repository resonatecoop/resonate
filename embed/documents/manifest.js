const hyperstream = require('hstream')
const getBase = require('../lib/base')

module.exports = function () {
  return hyperstream({
    head: { _appendHtml: `<link rel="manifest" href="${getBase('/manifest.json')}" crossorigin="use-credentials">` }
  })
}
