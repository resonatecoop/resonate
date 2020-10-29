const Nanobounce = require('nanobounce')
const nanobounce = Nanobounce() // timeout defaults to 256ms.

module.exports = onResize

function onResize () {
  return (state, emitter) => {
    state.events.RESIZE = 'resize'

    emitter.on(state.events.DOMCONTENTLOADED, () => {
      window.onresize = onResize
    })

    function onResize () {
      nanobounce(() => {
        emitter.emit(state.events.RESIZE)
      })
    }
  }
}
