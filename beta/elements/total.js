const html = require('choo/html')
const { background: bg, borders: borderColors } = require('@resonate/theme-skins')

module.exports = renderTotal

function renderTotal (count) {
  const attrs = {
    class: `absolute flex items-center justify-center ph2 h2 f4 fw3 ml3 ${bg} ba bw ${borderColors}`,
    style: 'left:100%;top:50%;transform:translateY(-50%)'
  }

  return html`
    <small ${attrs}>
      ${count}
    </small>
  `
}
