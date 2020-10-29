const bankai = require('bankai/http')
const http = require('http')
const path = require('path')

const compiler = bankai(path.join(__dirname, './index.js'))
const server = http.createServer(function (req, res) {
  compiler(req, res, function () {
    res.statusCode = 404
    res.end('not found')
  })
})

server.listen(8080, function () {
  console.log('listening on port 8080')
})
