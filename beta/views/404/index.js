const html = require('choo/html')

module.exports = NotFound

function NotFound () {
  return (state, emit) => {
    return html`
      <div class="flex flex-auto">
        <div class="flex flex-column flex-auto justify-center items-center">
          <div class="measure">
            <h1 class="flex flex-column lh-title tc f2">
              404
              <small>Page not found</small>
            </h1>
          </div>
          <a href="/" class="link color-inherit dim dib grow">Go back to /</a>
        </div>
      </div>
    `
  }
}
