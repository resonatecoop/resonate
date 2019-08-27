const html = require('choo/html')
const icon = require('@resonate/icon-element')
const calculateCost = require('../components/player/calculateCost')
const assert = require('assert')

module.exports = streamCosts

function renderCost (count, status) {
  const cost = calculateCost(count)
  return html`
    <div>
      ${status === 2 ? 'Free' : cost}
    </div>
  `
}

function streamCosts (props) {
  const { count, status } = props

  assert.strictEqual(typeof (count), 'number', 'Play count should be of type number')

  return html`
    <div class="stream-costs flex justify-center items-center">
      <div class="flex flex-column">
        <span class="green pv2">Current stream</span>
        <span class="yellow pv2">Next stream</span>
      </div>
      <div class="flex flex-column">
        <div class="flex items-center green pv2">
          <span class="ph2">
            ${icon('token', { class: 'icon icon--sm fill--light-gray' })}
          </span>
          <span class="ph2">
            ${renderCost(count, status)}
          </span>
        </div>
        <div class="flex items-center yellow pv2">
          <span class="ph2">
            ${icon('token', { class: 'icon icon--sm fill-light-gray' })}
          </span>
          <span class="ph2">
            ${renderCost(count + 1, status)}
          </span>
        </div>
      </div>
    </div>
  `
}
