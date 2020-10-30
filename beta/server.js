const mount = require('koa-mount')
const jalla = require('jalla')
const app = jalla('./jalla')
const send = require('koa-send')

require('dotenv').config()

const PORT = process.env.APP_PORT || 8080

// only allow robots in production
app.use(mount('/robots.txt', function (ctx, next) {
  ctx.type = 'text/plain'
  ctx.body = `
    User-agent: *
    Disallow: ${process.env.NODE_ENV === 'production' ? '' : '/'}
  `
}))

app.use(mount('/sw.js', async (ctx, next) => {
  await send(ctx, './sw.js')
}))

app.listen(PORT)
