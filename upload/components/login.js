const html = require('choo/html')
const Component = require('choo/component')

class Login extends Component {
  constructor (id, state, emit) {
    super(id)

    this.emit = emit
    this.state = state
    this.local = state.components[id] = {}
  }

  createElement (props) {
    this.local.user = props.user

    return html`
      <div class="sticky flex flex-column flex-row-l flex-auto w-100 bg-black shadow-contour white z-1 ph3" style="top:var(--height-3);">
        <div class="flex mr4">
          <h1 class="lh-title fw4 f3">Connect your Artist account</h1>
        </div>
        <div class="flex flex-auto items-center mr2 mb4 mb0-l justify-end-l">
          <div>
            <a class="link flex items-center bg-white ba bw b--white black pv2 ph3 grow dim mr4" href="https://${process.env.APP_DOMAIN}/api/connect/resonate">Connect</a>
          </div>
          <div>
            <a class="link flex items-center db bg-transparent ba bw b--white white pv2 ph3 grow dim" href="https://resonate.is/join">Join</a>
          </div>
        </div>
      </div>
    `
  }

  update (props) {
    return props.user.id !== this.local.user.id
  }
}

module.exports = Login
