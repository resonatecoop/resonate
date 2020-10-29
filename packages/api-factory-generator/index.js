/* global Headers, fetch */

const queryString = require('query-string')
const isObject = require('isobject')
const Ajv = require('ajv')

const ajv = new Ajv({
  allErrors: true
})

const request = (path = '/', options = {}) => {
  const {
    auth = false,
    data,
    domain,
    credentials = 'include',
    lang = 'en',
    method = 'GET',
    mode = 'cors',
    multipart,
    clientId,
    prefix,
    scheme,
    timeout = 15000,
    token
  } = options

  if (clientId) {
    data.client_id = clientId
  }

  const param = path.match(new RegExp(/\[:(.*?)\]/)) // TODO handle multiple params
  const params = []

  if (param) {
    params.push(param[1])
  }

  const stringified = queryString.stringify(method === 'GET' ? data : { client_id: clientId })

  let body

  if (/post|put|delete/.test(method.toLowerCase())) {
    body = Object.assign({}, data)
  }

  const url = [
    scheme,
    domain,
    prefix,
    param ? path.replace(param[0], data[param[1]]) : path,
    stringified ? '?' + stringified : false
  ]
    .filter(Boolean)
    .join('')

  const headers = new Headers()

  if (token && auth) {
    headers.append('Authorization', 'Bearer ' + token)
  }

  headers.append('Accept-Language', lang)

  if (multipart) {
    body = data.formData
  } else {
    headers.append('Content-Type', 'application/json')
    body = JSON.stringify(body)
  }

  return Promise.race([
    new Promise((resolve, reject) => fetch(url, {
      headers,
      method,
      body,
      mode,
      credentials
    }).then(response => response.json())
      .then(json => resolve(json))
      .catch(err => reject(err))
    ),
    new Promise((resolve, reject) =>
      setTimeout(() => reject(new Error('timeout')), timeout)
    )
  ])
}

const computeRoutes = (routes, options = {}) => {
  const obj = {}

  for (const [key, route] of Object.entries(routes)) {
    if (route.path) {
      let schema
      let params
      let validate
      let multipart

      if (route.options) {
        multipart = route.options.multipart
      }

      if (route.schema) {
        schema = route.schema || {}
        params = Object.keys(schema.properties)
        validate = ajv.compile(schema)
      }

      obj[key] = (...args) => {
        let data = {}
        if (isObject(args[0] || multipart === true)) {
          data = args[0]
        } else {
          if (params) {
            params.forEach((key, index) => {
              data[key] = args[index]
            })
          }
        }
        if (validate) {
          const valid = validate(data)
          if (!valid) {
            const errors = validate.errors
            throw errors
          }
        }
        return request(route.path, Object.assign({}, { data }, options, route.options))
      }
    } else {
      obj[key] = computeRoutes(route, options)
    }
  }
  return obj
}

module.exports = (routes, options) => {
  const api = Object.create(
    computeRoutes(routes, options)
  )

  api.version = options.version

  if (options.user) {
    api.user = options.user
  }
  if (options.token) {
    api.token = options.token
  }
  if (options.clientId) {
    api.clientId = options.clientId
  }

  return api
}
