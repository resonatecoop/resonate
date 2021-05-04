// https://web.dev/customize-install/

module.exports = function () {
  return (state, emitter) => {
    state.displayMode = getPWADisplayMode()
    // Initialize deferredPrompt for use later to show browser install prompt.

    window.addEventListener('beforeinstallprompt', (e) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault()
      // Stash the event so it can be triggered later.
      state.deferredPrompt = e

      // Update UI notify the user they can install the PWA
      // showInstallPromotion();
      // Optionally, send analytics event that PWA install promo was shown.
      console.log("'beforeinstallprompt' event was fired.")
    })

    window.addEventListener('appinstalled', () => {
      // Hide the app-provided install promotion
      // hideInstallPromotion();
      // Clear the deferredPrompt so it can be garbage collected
      state.deferredPrompt = null
      // Optionally, send analytics event to indicate successful install
      console.log('PWA was installed')
    })

    window.matchMedia('(display-mode: standalone)').addEventListener('change', (evt) => {
      state.displayMode = 'browser'
      if (evt.matches) {
        state.displayMode = 'standalone'
      }
      console.log('DISPLAY_MODE_CHANGED', state.displayMode)
    })

    emitter.on('pwa:install', async () => {
      if (!state.deferredPrompt) {
        return emitter.emit('notify', { message: 'PWA cannot be installed right now' })
      }
      // Hide the app provided install promotion
      // hideInstallPromotion()
      // Show the install prompt
      state.deferredPrompt.prompt()
      // Wait for the user to respond to the prompt
      const { outcome } = await state.deferredPrompt.userChoice
      // Optionally, send analytics event with outcome of user choice
      console.log(`User response to the install prompt: ${outcome}`)
      // We've used the prompt, and can't use it again, throw it away
      state.deferredPrompt = null
    })

    function getPWADisplayMode () {
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches
      if (document.referrer.startsWith('android-app://')) {
        return 'twa'
      } else if (navigator.standalone || isStandalone) {
        return 'standalone'
      }
      return 'browser'
    }
  }
}
