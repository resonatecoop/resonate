const { isBrowser } = require('browser-or-node')

module.exports = () => {
  if (!isBrowser) return 'no-preference'

  const medias = {
    dark: '(prefers-color-scheme: dark)',
    light: '(prefers-color-scheme: light)',
    'no-preference': '(prefers-color-scheme: no-preference)'
  }

  for (const [scheme, media] of Object.entries(medias)) {
    if (window.matchMedia(media).matches) {
      return scheme
    }
  }

  return 'no-preference'
}
