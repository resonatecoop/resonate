const html = require('choo/html')
const Layout = require('../../elements/layout')
const icon = require('@resonate/icon-element')

module.exports = Layout(view)

function view (state, emit) {
  return html`
    <div class="flex flex-column w-100 w-75-m w-50-l mh3 mh0-ns mw6">
      ${state.release.data.id ? renderRelease(state) : ''}

      <a href="/">Home</a><br>
    </div>
  `

  function renderRelease (state) {
    const { id, title } = state.release.data

    return html`
      <div class="cf pa2">
        <div class="relative">
          <h1 class="lh-title">Add tracks to ${title}</h1>
          <a href="/releases/${id}" class="link flex absolute" style="top: 50%;left: -1rem;transform: translate3d(-100%, -50%, 0);">
            ${icon('back', { class: `icon icon--m fill-dark-gray grow` })}
          </a>
        </div>
      </div>
    `
  }
}
