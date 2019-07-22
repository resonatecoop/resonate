const hyperstream = require('hstream')
const getBase = require('../lib/base')

module.exports = function () {
  return hyperstream({
    'head': {
      _appendHtml: `<base href="${getBase('/')}"></base>`
    }
  })
}
