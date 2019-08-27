const separator = ' • '
const title = process.env.APP_TITLE

module.exports = (viewName) => {
  return viewName ? viewName + separator + title : title
}
