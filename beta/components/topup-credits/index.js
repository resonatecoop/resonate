/* global fetch */

const html = require('choo/html')
const nanostate = require('nanostate')
const icon = require('@resonate/icon-element')
const button = require('@resonate/button')
const Button = require('@resonate/button-component')
const Component = require('choo/component')
const PaymentMethods = require('../payment-methods')
const link = require('@resonate/link-element')
const nanologger = require('nanologger')
const log = nanologger('topup-credits')
const vatEu = require('../../lib/country-codes') // vat eu member states

const prices = [
  {
    amount: 5,
    tokens: 4088,
    checked: true
  },
  {
    amount: 10,
    tokens: 8176
  },
  {
    amount: 20,
    tokens: 16352
  },
  {
    amount: 50,
    tokens: 40880
  },
  {
    amount: 100,
    tokens: 81760
  }
]

class Credits extends Component {
  constructor (id, state, emit) {
    super(id)

    this.state = state
    this.emit = emit

    this.local = state.components[id] = Object.create({
      machine: nanostate('list', {
        list: { next: 'payment' },
        payment: { next: 'recap', prev: 'list' },
        recap: { next: 'checkout', prev: 'payment' },
        checkout: { next: 'list' }
      })
    })

    this.local.error = {
      reason: 'Unexpected error'
    }

    this.local.machine.event('error', nanostate('error', {
      error: { next: 'payment', prev: 'list' }
    }))

    this.local.machine.event('redirect', nanostate('retrieveIntent', {
      retrieveIntent: { next: 'recap', prev: 'list' }
    }))

    this.local.machine.on('error', () => {
      if (this.element) {
        this.rerender()
      }
    })

    /**
     * when user gets back from 3d secure flow
     * we should retrieve payment intent data using `payment_intent` query string
     */

    this.local.machine.on('retrieveIntent', async () => {
      try {
        const response = await state.api.payments.retrieveIntent({
          uid: this.state.user.uid,
          pi: this.state.query.payment_intent // set by stripe
        })

        const status = response.data.payment_intent.status

        if (status === 'requires_capture') {
          this.local.intent = response.data.payment_intent

          const order = response.data.order

          this.local.vat = order.vat === 1
          this.local.currency = order.currency
          this.local.intent = response.data.payment_intent

          emit(state.events.REPLACESTATE, state.href || '/') // will cleanup query strings

          this.local.machine.emit('next') // recap
        } else if (status === 'succeeded') {
          this.local.error.reason = 'Payment has already succeeded'
          this.local.machine.emit('error')
        } else if (status === 'requires_source') {
          this.local.error.reason = 'Payment was cancelled'
          this.local.machine.emit('error')
        } else {
          this.local.error.reason = response.message
          this.local.machine.emit('error')
        }
      } catch (err) {
        this.local.machine.emit('error')
      }
    })

    this.local.machine.on('payment', async () => {
      try {
        const response = this.local.intent ? await state.api.payments.updateIntent({
          uid: state.user.uid,
          pi: this.local.intent.id,
          tokens: this.local.data.tokens,
          currency: this.local.currency
        }) : await state.api.payments.createIntent({
          uid: state.user.uid,
          tokens: this.local.data.tokens,
          currency: 'EUR',
          vat: this.local.vat
        })

        this.local.intent = response.data.payment_intent

        if (this.element) {
          this.rerender()
        }
      } catch (err) {
        this.local.machine.emit('error')
      }
    })

    this.local.machine.on('recap', () => {
      if (this.element) {
        this.rerender()
      }
    })

    this.local.machine.on('list', () => {
      if (this.element) {
        this.rerender()
      }
    })

    this.local.machine.on('checkout', async () => {
      try {
        const status = this.local.intent.status

        if (status === 'requires_capture') {
          const response = await state.api.payments.captureIntent({
            uid: state.user.uid,
            pi: this.local.intent.id
          })

          this.local.intent = response.data.payment_intent

          this.emit('credits:set', response.data.total)
        } else if (status === 'succeeded') {
          this.local.error.reason = 'Payment has already succeeded'
          return this.local.machine.emit('error')
        } else {
          this.local.error.reason = 'Unexpected payment status'
          return this.local.machine.emit('error')
        }

        if (this.element) {
          this.rerender()
        }
      } catch (err) {
        this.local.machine.emit('error') // recap
        log.error(err.message)
      }
    })

    this.local.index = 0
    this.local.checkoutResult = {
      loading: false
    }
    this.local.vat = false
    this.local.rate = 1
    this.local.currency = 'EUR'
    this.local.data = prices[this.local.index]

    if (this.state.query.payment_intent) {
      this.local.machine.emit('redirect')
    }
  }

  createElement (props) {
    const state = this.state
    const emit = this.emit
    const paymentStep = {
      retrieveIntent: placeholder,
      error: displayError,
      list: renderList,
      payment: renderPayment,
      recap: renderRecap,
      checkout: renderCheckout
    }[this.local.machine.state]

    return html`
      <div class="topup-credits-component">
        ${paymentStep(this.local, state, emit)}
      </div>
    `
  }

  unload () {
    if (this.local.intent) {
      const statuses = ['requires_payment_method', 'requires_capture', 'requires_confirmation', 'requires_action']
      if (statuses.includes(this.local.intent.status)) {
        this.state.api.payments.cancelIntent({
          uid: this.state.user.uid,
          pi: this.local.intent.id,
          reason: 'abandoned'
        })
      }
    }

    this.emit(this.state.events.REPLACESTATE, this.state.href || '/') // will cleanup query strings
  }

  update () {
    return false
  }
}

function displayError (local, state, emit) {
  const { machine } = local
  const prevButton = new Button('next', state, emit)

  return html`
    <div>
      <h2 class="lh-title f3">An error occured</h2>

      <p class="lh-copy f5">${local.error.reason}</p>

      <div class="flex flex-auto justify-between mt3">
        ${prevButton.render({
          onClick: function (e) {
            e.preventDefault()
            e.stopPropagation()

            machine.emit('prev')

            emit(state.events.REPLACESTATE, state.href || '/') // will cleanup query strings

            return false
          },
          type: 'button',
          text: 'Try again',
          size: 'none'
        })}
      </div>
    </div>
  `
}

/**
 * Final step
 */

function renderCheckout (local, state, emit) {
  const { machine, checkoutResult } = local
  const { status, errorMessage } = checkoutResult
  // const { tokens } = prices.find(({ amount }) => amount === this.data.amount)

  const title = {
    success: 'Payment confirmed',
    failed: 'Payment not confirmed'
  }[status]

  const nextButton = new Button('next', state, emit)

  const closeButton = button({
    value: status,
    type: 'submit',
    text: 'Ok',
    size: 'none'
  })

  const message = errorMessage
    ? renderMessage(html`<p>${errorMessage}</p>`)
    : renderMessage([
      html`<p>Your credits have been topped up.</p>`,
      html`<p>We\'re very eager to learn how you find the #stream2own experience. Reach out through the ${link({ prefix: 'link b', text: 'support page', href: 'https://resonate.is/music/support' })} any time to share your thoughts.</p>`
    ])

  return html`
    <div>
      <div id="payment-errors"></div>
      <div class="flex flex-column">
        <h2 class="lh-title f3">${title}</h2>
        ${message}
        <div class="flex flex-auto justify-between mt3">
          ${status === 'failed' ? nextButton.render({
            onClick: function (e) {
              e.preventDefault()
              e.stopPropagation()

              nextButton.disable('Please wait...')

              machine.emit('next')

              return false
            },
            type: 'button',
            text: 'Try again',
            size: 'none'
          }) : ''}
          ${closeButton}
        </div>
      </div>
    </div>
  `
}

/**
 * Render payment details before confirmation
 */

function renderRecap (local, state, emit) {
  const { machine, data, rate, vat } = local
  const currency = local.currency === 'EUR' ? '€' : '$'
  const amount = local.currency === 'EUR' ? data.amount : data.amount * rate

  const cancelButton = new Button('cancel-button')
  const nextButton = new Button('checkout-button')

  const vatAmount = vat ? 0.23 * amount : 0

  return html`
    <div>
      <p class="f3">Invoice</p>
      <div class="flex flex-auto pa3">
        <div class="flex w-100 mid-gray flex-auto">
          Subtotal
        </div>
        <div class="flex w-100 flex-auto justify-end">
          ${currency}${amount.toFixed(2)}
        </div>
      </div>
      <div class="flex flex-auto pa3">
        <div class="flex w-100 mid-gray flex-auto">
          VAT
        </div>
        <div class="flex w-100 flex-auto justify-end">
          ${currency}${vatAmount.toFixed(2)}
        </div>
      </div>
      <div class="ba bw1 b--mid-gray"></div>
      <div class="flex flex-auto pa3">
        <div class="flex w-100 mid-gray flex-auto">
          Total
        </div>
        <div class="flex w-100 flex-auto justify-end">
          ${currency}${(vatAmount + amount).toFixed(2)}
        </div>
      </div>
      <div class="flex flex-auto justify-between mt3">
        ${cancelButton.render({
          onClick: async function (e) {
            e.preventDefault()
            e.stopPropagation()

            cancelButton.disable('Please wait...')

            await state.api.payments.cancelIntent({
              uid: state.user.uid,
              pi: local.intent.id,
              reason: 'requested_by_customer'
            })

            delete local.intent

            machine.emit('prev')

            return false
          },
          type: 'button',
          text: 'Cancel',
          size: 'none'
        })}
        <div class="mt3">
          ${nextButton.render({
            onClick: function (e) {
              e.preventDefault()
              e.stopPropagation()

              nextButton.disable('Please wait...')

              machine.emit('next')

              return false
            },
            type: 'button',
            text: 'Check out',
            size: 'none'
          })}
        </div>
      </div>
    </div>
  `
}

function placeholder (local, state, emit) {
  return html`
    <div>
      <div class="flex flex-column">
        <p class="f3">Please wait...</p>
      </div>
    </div>
  `
}

/**
 * Render stripe cards elements
 */

function renderPayment (local, state, emit) {
  const { machine } = local

  const paymentMethods = state.cache(PaymentMethods, 'payment-methods').render({
    onPrev: () => {
      machine.emit('prev')
    },
    onSubmit: async function (e, { element: cardElement, formData }) {
      e.preventDefault()
      e.stopPropagation()

      try {
        if (local.intent.status === 'requires_capture') {
          return machine.emit('next')
        }

        let response

        response = await state.stripe.createPaymentMethod('card', cardElement, {
          billing_details: {
            name: formData.name
          }
        })

        const { paymentMethod } = response
        const paymentMethodId = paymentMethod.id
        const countryCode = paymentMethod.card.country

        // Add 23% VAT if credit card from EU given country code in self.token
        if (vatEu.indexOf(countryCode) > -1) {
          local.vat = true

          await state.api.payments.updateIntent({
            uid: state.user.uid,
            pi: local.intent.id,
            tokens: local.data.tokens,
            currency: local.currency,
            vat: true
          })
        }

        if (countryCode === 'US') {
          const ratesApiHost = process.env.RATES_API_HOST || 'https://api.ratesapi.io'
          const ratesApiURL = `${ratesApiHost}/latest?base=EUR&symbols=USD`
          const { rates } = await (await fetch(ratesApiURL)).json()

          local.rate = rates.USD
          local.currency = 'USD'

          await state.api.payments.updateIntent({
            uid: state.user.uid,
            pi: local.intent.id,
            tokens: local.data.tokens,
            currency: local.currency,
            vat: local.vat
          })
        }

        response = await state.api.payments.confirmIntent({
          uid: state.user.uid,
          pi: local.intent.id,
          payment_method: paymentMethodId
        })

        if (!response.data) {
          local.error.reason = response.message
          return machine.emit('error')
        }

        if (response.data.status === 'requires_source_action') {
          const action = response.data.next_action

          if (action && action.type === 'redirect_to_url') {
            const url = response.data.next_action.redirect_to_url.url

            return emit('redirect', {
              dest: url,
              message: 'Payment requires 3D Secure. You will be redirected…'
            })
          }
        } else {
          local.intent = response.data

          return machine.emit('next')
        }
      } catch (err) {
        machine.emit('error')
        log.error(err.message)
      }
    }
  })

  return html`
    <div>
      <div class="flex flex-column">
        <p class="f3">Payment</p>
        <div id="card-errors"></div>
        ${paymentMethods}
      </div>
    </div>
  `
}

function renderList (local, state, emit) {
  const { machine } = local

  const nextButton = new Button('next', state, emit)

  return html`
    <div>
      <div class="flex flex-column">
        <p class="f3">Add Credits</p>
        <p class="f4">How much would you like to top up?</p>
        <div class="flex">
          <div class="pa3 flex w-100 flex-auto">
          </div>
          <div class="pa3 flex w-100 flex-auto">
          </div>
          <div class="pa3 flex w-100 flex-auto f4 mid-gray">
            Credits
          </div>
        </div>
        ${prices.map(priceItem)}
      </div>
      <div class="mt3">
        ${nextButton.render({
          onClick: function (e) {
            e.preventDefault()
            e.stopPropagation()

            nextButton.disable('Please wait...')

            machine.emit('next')

            return false
          },
          type: 'button',
          text: 'Next',
          size: 'none'
        })}
      </div>
    </div>
  `

  function priceItem (item, index) {
    const { amount, tokens } = item
    const attrs = {
      style: 'opacity: 0;width: 0;height: 0;',
      onchange: updateSelection,
      tabindex: -1,
      id: 'amount-' + index,
      name: 'amount',
      type: 'radio',
      checked: amount === local.data.amount,
      value: amount
    }

    return html`
      <div class="flex w-100 flex-auto">
        <input ${attrs} />
        <label class="flex items-center justify-center w-100" tabindex="0" onkeypress=${handleKeyPress} for=${'amount-' + index}>
          <div class="pa3 flex w-100 flex-auto">
            <div class="flex items-center justify-center ba bw1 pa1 b--mid-gray">
              ${icon('circle', { size: 'xs', class: 'fill-transparent' })}
            </div>
          </div>
          <div class="pa3 flex w-100 flex-auto f3">
            €${amount}
          </div>
          <div class="pa3 flex w-100 flex-auto f4 dark-gray">
            ${formatCredit(tokens)}
          </div>
        </label>
      </div>
    `
  }

  function updateSelection (e) {
    const val = parseInt(e.target.value, 10)
    log.info(`select:${val}`)
    const index = prices.findIndex((item) => item.amount === val)
    local.data = prices[index]
  }

  function handleKeyPress (e) {
    if (e.keyCode === 13 && !e.target.control.checked) {
      e.preventDefault()
      e.target.control.checked = !e.target.control.checked
      const val = parseInt(e.target.control.value, 10)
      const index = prices.findIndex((item) => item.amount === val)
      local.data = prices[index]
    }
  }
}

function formatCredit (tokens) {
  return (tokens / 1000).toFixed(4)
}

function renderMessage (text) {
  return html`
    <article>
      ${Array.isArray(text) ? text.map(line => line) : text}
    </article>
  `
}

module.exports = Credits
