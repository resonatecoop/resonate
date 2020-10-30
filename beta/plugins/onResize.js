const Nanobounce = require('nanobounce')
const nanobounce = Nanobounce() // timeout defaults to 256ms.

module.exports = () => {
  return (state, emitter) => {
    emitter.on(state.events.DOMCONTENTLOADED, () => {
      window.onresize = onResize
    })

    function onResize () {
      return nanobounce(() => {
        emitter.emit(state.events.RENDER)
      })
    }
  }
}
