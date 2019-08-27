const html = require('nanohtml')
// const circles = [ [2, 2], [9, 2], [16, 2], [2, 9], [9, 9], [16, 9], [2, 16], [9, 16], [16, 16] ]
const circles = [[3, 3], [12, 3], [21, 3], [3, 12], [12, 12], [21, 12], [3, 21], [12, 21], [21, 21]]
// const scaled = ((scale * r) * 2) * 3 + (scale * 2) * 3 // expand width

module.exports = (id, options = {}) => {
  const scale = options.scale || 1
  const r = 2 // base radius
  const {
    prefix = 'counter',
    width: w = 24,
    height: h = 24,
    strokeWidth = 1.5,
    stroke = '#c4c4c4',
    fill = 'transparent'
  } = options

  return html`
    <svg class=${prefix} id=${id} transform="scale(${scale})" stroke-width=${strokeWidth} viewbox="0 0 ${w} ${h}" width=${w} height=${h}>
      ${circles.map(([cx, cy]) => html`
        <circle stroke=${stroke} cx=${cx} cy=${cy} r=${r} fill=${fill} />
      `)}
    </svg>
  `
}
