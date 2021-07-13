<div align="center">
  <h1 align="center">stream2own</h1>
  <strong>Play fair.</strong>
</div>

<br />

<div align="center">
  <h3>
    <a href="https://resonate.is">
      Website
    </a>
    <span> | </span>
    <a href="https://beta.resonate.is">
      Beta app
    </a>
    <span> | </span>
    <a href="https://github.com/resonatecoop/stream2own/blob/master/CONTRIBUTING.md">
      Contributing
    </a>
    <span> | </span>
    <a href="https://www.twitter.com/resonatecoop/">
      Twitter
    </a>
    <span> | </span>
    <a href="https://resonate.is/contact-us/join-developer-forum/">
      Developer forum
    </a>
  </h3>
</div>

<br />

<div align="center">
  <!-- Standard -->
  <a href="https://standardjs.com">
    <img src="https://img.shields.io/badge/code%20style-standard-brightgreen.svg?style=flat-square"
      alt="Standard" />
  </a>
</div>

## Table of Contents
- [API](#api)
- [Installation](#installation)
- [Development](#development)
- [Environment](#environment)
- [Testing](#testing)
- [Commands](#commands)
- [Code style](#code-style)
- [Contributors](#contributors)
- [See Also](#see-also)

## API

If you want to build on the API for personal use, check out the [Migrate to new APIs project](https://github.com/resonatecoop/stream/projects/5#card-59829409) and consider checking the [backlog in our community forum](https://community.resonate.is/c/platform/52). 

## Installation

First, make sure you have the latest version of [node.js](https://nodejs.org/)

To use this project you also need [lerna](https://github.com/lerna/lerna). Lerna is a tool for managing JavaScript projects with multiple packages. .

```sh
npm i lerna -g
```

Then you should install dependencies using the bootstrap command.

```sh
lerna bootstrap
```

## Development

### Beta app

To start beta app with `bankai`.

```sh
npm start
```

By default, the app is accessible at `https://localhost:8080`.

See [bankai](https://github.com/choojs/bankai) docs for usage.

### Other apps (embed, upload, ...)

Replace `embed` with the target app if different. 

```sh
lerna run --scope embed start --parallel
```

### Add a package

```sh
lerna add @resonate/button --scope "beta"
```

### Add a dev dependency

Here's how you would add gulp to tools

```sh
lerna add gulp --scope tools
```

### Build

Compile app to `dist` using bankai.

```sh
npm run build
```

To compile a specific package

```sh
lerna run build --scope "@resonate/rangeslider"
```

## Testing

Run all tests (standard, dependency-check)

```sh
npm test
```

Test a specific component

```sh
lerna run test --scope "@resonate/player-component"
```

A package can have browser tests (tape-run)

```sh
lerna run test:browser --scope "@resonate/api-factory-generator"
```

## Environment

Setup your env variables for development

```sh
cp .env.example .env
```

## Nginx

You can find an example [nginx configuration](/docs/nginx/beta.resonate.localhost.conf) file in the docs.

## HTTPS

Secure connection is required to fully test PWA's. Bankai does generate a certificate for localhost. It should be located at `~/.config/bankai`. See [HTTPS instructions](https://github.com/choojs/bankai#%EF%B8%8F--https-instructions).

If you want, you can generate a custom certificate using [mkcert](https://github.com/FiloSottile/mkcert) for `beta.resonate.localhost`. This origin is whitelisted in our CORS config.

## Commands

Commands needs to be ran with `$ lerna run`.

Example: `$ lerna run --scope beta start --parallel`.

Command                 | Description                                      |
------------------------|--------------------------------------------------|
`$ npm run dev`         | Start beta app development server
`$ npm test`            | Lint, validate deps & run dependency-check for all packages
`$ npm run build`       | Compile all beta app files into `beta/dist/`

## Code style

We use [standard](https://standardjs.com/) as a linter and javascript style guide.
Make sure to add appropriate plugin for your editor (see: [standard#are-there-text-editor-plugins](https://github.com/standard/standard#are-there-text-editor-plugins))

## Maintainers

- Augustin Godiscal <auggod@resonate.is>
- Marie <marie@resonate.is>

## See Also
- [choo](https://github.com/choojs/choo) - sturdy 4kb frontend framework
- [bankai](https://github.com/choojs/bankai) - streaming asset compiler
- [nanohtml](https://github.com/choojs/nanohtml) - HTML template strings for the Browser with support for Server Side Rendering in Node.
  strings
- [nanocomponent](https://github.com/choojs/nanocomponent) - create performant HTML components
- [tachyons](https://github.com/tachyons-css/tachyons) - functional CSS for
  humans
- [sheetify](https://github.com/stackcss/sheetify) - modular CSS bundler for
  `browserify`
