const html = require('choo/html')
const icon = require('@resonate/icon-element')

module.exports = (state, form) => {
  const pristine = form.pristine
  const errors = form.errors

  const messages = Object.keys(errors).map((name) => {
    if (errors[name] && !pristine[name]) {
      return {
        message: errors[name].message,
        name
      }
    }
    return false
  }).filter(Boolean)

  return html`
    <div style="display:${messages.length ? 'block' : 'none'}" class="flex flex-column pa2 mb3 ba bw b--black-50">
      <h4 class="body-color f4 ma0">Something went wrong.</h4>
      <h5 class="body-color f5 ma0 pv1">Please check the errors in the form and try again.</h5>
      <ul class="flex flex-column list ma0 pa0 ml3 error">
        ${messages.map(messageItem)}
      </ul>
    </div>
  `

  function messageItem ({ message, name }) {
    return html`
      <li class="flex items-center pv1">
        ${icon('info', { 'class': 'icon fill-red icon--sm' })}
        <a href="/#${name}" onclick=${handleClick} class="ml1 link db underline">
          ${message}
        </a>
      </li>
    `

    function handleClick (e) {
      e.preventDefault()
      focusToInput(name)
    }
  }

  function focusToInput (name) {
    const invalidInput = document.querySelector(`#${name}`)
    if (invalidInput) {
      invalidInput.focus({ preventScroll: false }) // focus to first invalid input
    }
  }
}
