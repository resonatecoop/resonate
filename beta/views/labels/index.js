const { isNode } = require('browser-or-node')
const html = require('choo/html')
const Labels = require('../../components/labels')
const { background } = require('@resonate/theme-skins')
const viewLayout = require('../../elements/view-layout')
const Layout = require('../../elements/layout')

module.exports = Layout(LabelsView)

function LabelsView () {
  return (state, emit) => {
    isNode && emit('prefetch:labels')

    const labels = state.cache(Labels, 'labels').render({
      items: state.labels.items,
      numberOfPages: state.labels.numberOfPages
    })

    return viewLayout((state, emit) => html`
      <section id="labels" class="${background} flex flex-column flex-auto w-100 pb6 ph3">
        ${labels}
      </section>
    `
    )(state, emit)
  }
}
