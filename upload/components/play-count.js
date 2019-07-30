const html = require('choo/html')
const PlayCount = require('@resonate/play-count')
const renderCounter = require('@resonate/counter')
const Nanocomponent = require('nanocomponent')

class Playcount extends Nanocomponent {
  constructor (name, state, emit) {
    super(name)

    this.props = {
      count: 9,
      name: 'counter',
      options: {}
    }
    this.state = {}
  }

  createElement (props) {
    this.state.name = props.name
    this.state.count = props.count
    this.state.options = props.options
    const counter = renderCounter(this.state.name, { scale: 3, strokeWidth: 1 })
    const playCount = new PlayCount(this.state.count, this.state.options)
    playCount.counter = counter
    playCount.circles = counter.querySelectorAll('circle')

    this.state.playCount = playCount
    this.state.counter = playCount.counter

    return html`
      <div id=${this.state.name}>
        ${this.state.counter}
      </div>
    `
  }

  unload () {
    this.state.playCount.stop()
    this.state.playCount.options.animate = false
  }

  update (props) {
    return props.count !== this.state.count
  }
}

module.exports = Playcount
