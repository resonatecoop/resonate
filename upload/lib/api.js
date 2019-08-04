const apiFactoryGenerator = require('@resonate/api-factory-generator')

/**
 * REST API configuration
 * @param {object} options Options for apiFactoryGenerator
 */
const generateApi = (options) => {
  const defaultOptions = {
    scheme: 'https://',
    domain: process.env.API_DOMAIN || 'upload.resonate.localhost',
    prefix: process.env.API_PREFIX || '/api',
    auth: true,
    version: 1
  }

  return apiFactoryGenerator({
    artworks: {
      find: {
        path: '/artworks',
        schema: {
          type: 'object',
          properties: {
            limit: {
              type: 'number'
            },
            page: {
              type: 'number'
            }
          }
        }
      }
    },
    tracks: {
      find: {
        path: '/tracks',
        schema: {
          type: 'object',
          properties: {
            limit: {
              type: 'number'
            },
            page: {
              type: 'number'
            }
          }
        }
      }
    },
    releases: {
      find: {
        path: '/releases',
        schema: {
          type: 'object',
          properties: {
            limit: {
              type: 'number'
            },
            page: {
              type: 'number'
            }
          }
        }
      },
      findOne: {
        path: '/releases/[:id]',
        schema: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid'
            }
          }
        }
      },
      create: {
        path: '/releases',
        options: {
          method: 'POST'
        },
        schema: {
          type: 'object',
          additionalProperties: false,
          required: ['title', 'type', 'display_artist', 'release_date', 'cover', 'composers', 'performers'],
          properties: {
            display_artist: {
              type: 'string'
            },
            title: {
              type: 'string'
            },
            cover: {
              type: 'string',
              format: 'uuid'
            },
            about: {
              type: 'string',
              maxLength: 200
            },
            tags: {
              type: 'array',
              items: {
                type: 'string'
              }
            },
            release_date: {
              type: 'string',
              format: 'date'
            },
            type: {
              type: 'string',
              enum: ['lp', 'ep', 'single']
            },
            performers: {
              type: 'array',
              items: {
                type: 'string'
              }
            },
            composers: {
              type: 'array',
              items: {
                type: 'string'
              }
            }
          }
        }
      }
    },
    user: {
      path: '/user'
    },
    upload: {
      path: '/upload',
      method: 'POST',
      multipart: true
    }
  }, Object.assign(defaultOptions, options))
}

module.exports = generateApi
