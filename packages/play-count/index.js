class PlayCount {
  constructor (count, options = {}) {
    this.count = count
    this.options = options
    this.fillColor = options.fillColor || '#000'
    this.timings = Object.assign({
      interval: 1000 / options.fps,
      then: Date.now()
    }, { count })
    this._circles = []
    this.animationStartTime = 0
    this.requestId = 0
    this.stop = this.stop.bind(this)
    this.animate = this.animate.bind(this)
    this.tick = this.tick.bind(this)
    this.sort = this.sort.bind(this)
  }

  set counter (counter) {
    this._counter = counter
    this._circles = [...counter.querySelectorAll('circle')]
  }

  get counter () {
    const { animate = false } = this.options
    const count = this.count
    const circles = this._circles

    if (animate) {
      this.animate()
    } else {
      for (const [index, circle] of Object.entries(this.sort(circles))) {
        if (parseInt(index, 10) <= parseInt(count, 10) - 1) {
          circle.setAttribute('stroke', this.fillColor)
          circle.setAttribute('fill', this.fillColor)
        }
      }
    }

    return this._counter
  }

  sort (circles = []) {
    const { sort = 'flip' } = this.options

    switch (sort) {
      case 'reverse':
        return circles.reverse()
      case 'flip':
        return [
          ...circles.slice(6, 9),
          ...circles.slice(3, 6),
          ...circles.slice(0, 3)
        ]
      case 'random':
        return circles.sort(() => (0.5 - Math.random()))
      default:
        return circles
    }
  }

  stop () {
    if (this.requestId) window.cancelAnimationFrame(this.requestId)
    this.requestId = 0
  }

  animate (time) {
    this.animationStartTime = window.performance.now()
    this.requestId = window.requestAnimationFrame(this.animate)
    this.tick()
  }

  tick () {
    const { reach = 9, repeat = false } = this.options
    const circles = this._circles

    this.timings.now = Date.now()
    this.timings.delta = this.timings.now - this.timings.then

    if (this.timings.delta > this.timings.interval) {
      if (this.timings.count < 9) {
        this.timings.count++
      } else {
        if (repeat) this.timings.count = 0
        else {
          this.stop()
        }
      }
      this.timings.then = this.timings.now - (this.timings.delta % this.timings.interval)

      for (const [index, circle] of Object.entries(this.sort(circles))) {
        circle.setAttribute('fill', 'transparent')
        circle.setAttribute('stroke', '#c4c4c4')
        if (parseInt(index, 10) <= this.timings.count - 1) {
          circle.setAttribute('stroke', this.fillColor)
          circle.setAttribute('fill', this.fillColor)
        }
        if (parseInt(index, 10) === reach - 1) return
      }
    }
  }
}

module.exports = PlayCount
