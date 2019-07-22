const separator = ' • '
const title = require('../manifest.json').name

module.exports = (viewName) => {
  return viewName ? viewName + separator + title : title
}
