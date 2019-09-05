# @resonate/button

Render an HTML button element

## Install

```sh
$ npm i --save @resonate/button
```

Using lerna

```sh
$ lerna add @resonate/button --scope "@resonate/app"
```

## Usage

```js

const button = require('@resonate/button')

const myButton = button({
  style: 'blank',
  prefix: 'play-button',
  onClick: () => {
    // do something
  },
  title: playing ? 'Pause' : 'Play',
  iconName: playing ? 'pause' : 'play'
})

document.body.appendChild(myButton)

```

## Options

- `prefix` A single class or classlist
- `onClick` Button onclick event handler
- `value` Button value
- `type` Button type (default is 'button')
- `disabled` Button disabled state (default is false)
- `style` Button style (default, blank)
- `iconName` SVG icon name
- `iconFill` Class names for svg icon fills (see: @resonate/theme-skins)
- `iconSize` SVG icon size (xs, sm, md, lg)
- `text` Button text

## License

MIT

## Author(s)

- Augustin Godiscal <auggod@resonate.is>
