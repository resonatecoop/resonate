# SVG Icons

## How to include an svg icon

```js
// some-element.js

const html = require('choo/html')
const icon = require('@resonate/icon-element')

function someElement () {
  return html`
    <div>
      ${icon('logo', { 'class':'icon icon--md fill-black'})}
    </div>
}

module.exports = someElement

```

## SVG icon set

```html
<!-- beta/index.html -->
...
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" style="display:none" width="100" height="100">
  <symbol viewBox="0 0 100 100" id="icon-play">
    <path d="M2 98c-.3 0-.7-.1-1-.3-.7-.4-1-1-1-1.7V4c0-.7.3-1.3 1-1.6a2 2 0 0 1 2-.1l95.8 46c.8.3 1.2.9 1.2 1.7 0 .8-.4 1.4-1.2 1.8L3 97.8a4 4 0 0 1-1 .2z"/>
  </symbol>
</svg>
...
```

## Related files

- [/packages/icon-element/index.js](/packages/icon-element/index.js)
- [/beta/index.html](/beta/index.html)
