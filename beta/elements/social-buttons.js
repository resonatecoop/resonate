const html = require('choo/html')
const normalizeUrl = require('normalize-url')
const icon = require('@resonate/icon-element')
const parseUrl = require('url-parse')

module.exports = (items) => {
  const links = Object.entries(items)
    .filter(([key, val]) => val !== '' && val !== null)
    .map(([name, value]) => {
      if (!value.includes(name) && name === 'facebook') {
        value = value.replace(/^/, 'https://facebook.com/')
      }
      if (!value.includes(name) && name === 'twitter') {
        value = value.replace(/^/, 'https://twitter.com/')
      }
      const url = normalizeUrl(value, { stripWWW: false })
      const parsedUrl = parseUrl(url, true)
      const title = parsedUrl.pathname.replace('/', '') || parsedUrl.hostname
      return html`
        <li>
          <a target="_blank" rel="noopener noreferer" href="${url}" class="flex items-center f7 pv2 color-inherit">
            ${icon(name, { class: 'icon icon--xs fill-black fill-white--dark' })}
            <span class="pl2">${title}</span>
          </a>
        </li>
      `
    })
  return html`
    <ul id="links" class="flex flex-column list ma0 pa0">
      ${links}
    </ul>
  `
}
