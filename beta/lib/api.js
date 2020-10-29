const apiFactoryGenerator = require('@resonate/api-factory-generator')

/**
 * REST API configuration
 * @param {object} options Options for apiFactoryGenerator
 */
const generateApi = (options) => {
  const defaultOptions = {
    scheme: 'https://',
    domain: process.env.API_DOMAIN || 'api.resonate.localhost',
    prefix: process.env.API_PREFIX || '/v1',
    auth: true,
    version: 1,
    clientId: process.env.ANON_USER,
    user: {
      uid: 0
    }
  }

  return apiFactoryGenerator({
    payments: {
      retrieveIntent: {
        path: '/users/[:uid]/payment/intent/retrieve',
        options: {
          method: 'POST'
        },
        schema: {
          type: 'object',
          properties: {
            uid: {
              type: 'number'
            },
            pi: {
              type: 'string'
            }
          }
        }
      },
      confirmIntent: {
        path: '/users/[:uid]/payment/intent/confirm',
        options: {
          method: 'POST'
        },
        schema: {
          type: 'object',
          properties: {
            uid: {
              type: 'number'
            },
            pi: {
              type: 'string'
            },
            payment_method: {
              type: 'string'
            }
          }
        }
      },
      cancelIntent: {
        path: '/users/[:uid]/payment/intent/cancel',
        options: {
          method: 'POST'
        },
        schema: {
          type: 'object',
          properties: {
            uid: {
              type: 'number'
            },
            pi: {
              type: 'string'
            },
            reason: {
              type: 'string',
              enum: ['requested_by_customer', 'abandoned']
            }
          }
        }
      },
      createIntent: {
        path: '/users/[:uid]/payment/intent/create',
        options: {
          method: 'POST'
        },
        schema: {
          type: 'object',
          properties: {
            uid: {
              type: 'number'
            },
            tokens: {
              type: 'number',
              enum: [4088, 8176, 16352, 40880, 81760]
            },
            currency: {
              type: 'string',
              enum: ['EUR', 'USD']
            },
            vat: {
              type: 'boolean'
            }
          }
        }
      },
      updateIntent: {
        path: '/users/[:uid]/payment/intent/update',
        options: {
          method: 'POST'
        },
        schema: {
          type: 'object',
          properties: {
            uid: {
              type: 'number'
            },
            pi: {
              type: 'string'
            },
            tokens: {
              type: 'number',
              enum: [4088, 8176, 16352, 40880, 81760]
            },
            currency: {
              type: 'string',
              enum: ['EUR', 'USD']
            },
            vat: {
              type: 'boolean'
            }
          }
        }
      },
      captureIntent: {
        path: '/users/[:uid]/payment/intent/capture',
        options: {
          method: 'POST'
        },
        schema: {
          type: 'object',
          properties: {
            uid: {
              type: 'number'
            },
            pi: {
              type: 'string'
            }
          }
        }
      }
    },
    plays: {
      buy: {
        path: '/users/[:uid]/plays/buy',
        options: {
          method: 'POST'
        },
        schema: {
          type: 'object',
          properties: {
            uid: {
              type: 'number'
            },
            tid: {
              type: 'number'
            }
          }
        }
      },
      add: {
        path: '/users/[:uid]/plays',
        options: {
          method: 'POST'
        },
        schema: {
          type: 'object',
          properties: {
            uid: {
              type: 'number'
            },
            tid: {
              type: 'number'
            }
          }
        }
      }
    },
    users: {
      favorites: {
        resolve: {
          path: '/users/[:uid]/tracks/favorites',
          options: {
            method: 'POST'
          },
          schema: {
            type: 'object',
            properties: {
              uid: {
                type: 'number'
              },
              ids: {
                type: 'array',
                items: {
                  type: 'number'
                }
              }
            }
          }
        },
        toggle: {
          path: '/users/[:uid]/tracks/favorites',
          options: {
            method: 'POST'
          },
          schema: {
            type: 'object',
            properties: {
              uid: {
                type: 'number'
              },
              tid: {
                type: 'number'
              }
            }
          }
        }
      },
      tracks: {
        favorites: {
          path: '/users/[:uid]/tracks/favorites',
          schema: {
            type: 'object',
            properties: {
              uid: {
                type: 'number'
              },
              limit: {
                type: 'number'
              },
              page: {
                type: 'number'
              }
            }
          }
        },
        owned: {
          path: '/users/[:uid]/tracks/owned',
          schema: {
            type: 'object',
            properties: {
              uid: {
                type: 'number'
              },
              limit: {
                type: 'number'
              },
              page: {
                type: 'number'
              }
            }
          }
        },
        history: {
          path: '/users/[:uid]/plays',
          schema: {
            type: 'object',
            properties: {
              uid: {
                type: 'number'
              },
              limit: {
                type: 'number'
              },
              page: {
                type: 'number'
              }
            }
          }
        }
      }
    },
    auth: {
      user: {
        path: '/oauth2/user'
      },
      tokens: {
        path: '/oauth2/tokens',
        options: {
          method: 'POST'
        },
        schema: {
          type: 'object',
          properties: {
            uid: {
              type: 'number'
            },
            access_token: {
              type: 'string',
              format: 'uuid'
            }
          }
        }
      },
      login: {
        path: '/oauth2/password',
        options: {
          method: 'POST'
        },
        schema: {
          type: 'object',
          properties: {
            username: {
              type: 'string'
            },
            password: {
              type: 'string'
            }
          }
        }
      }
    },
    labels: {
      query: {
        path: '/labels',
        options: {
          method: 'POST'
        },
        schema: {
          type: 'object',
          properties: {
            ids: {
              type: 'array',
              items: {
                type: 'number'
              }
            }
          }
        }
      },
      search: {
        path: '/labels',
        schema: {
          type: 'object',
          properties: {
            q: {
              type: 'string'
            }
          }
        }
      },
      find: {
        path: '/labels',
        schema: {
          type: 'object',
          properties: {
            page: {
              type: 'number'
            },
            limit: {
              type: 'number'
            }
          }
        }
      },
      findOne: {
        path: '/labels/[:uid]',
        schema: {
          type: 'object',
          properties: {
            uid: {
              type: 'number'
            }
          }
        }
      },
      getLinks: {
        path: '/labels/[:uid]/links',
        schema: {
          type: 'object',
          properties: {
            uid: {
              type: 'number'
            }
          }
        }
      },
      getArtists: {
        path: '/labels/[:uid]/artists',
        schema: {
          type: 'object',
          properties: {
            uid: {
              type: 'number'
            },
            limit: {
              type: 'number'
            }
          }
        }
      },
      getAlbums: {
        path: '/labels/[:uid]/albums',
        schema: {
          type: 'object',
          properties: {
            uid: {
              type: 'number'
            },
            limit: {
              type: 'number'
            }
          }
        }
      }
    },
    artists: {
      find: {
        path: '/artists',
        schema: {
          type: 'object',
          properties: {
            page: {
              type: 'number'
            },
            limit: {
              type: 'number'
            },
            order: {
              type: 'string',
              enum: ['desc', 'asc']
            },
            order_by: {
              type: 'string',
              enum: ['name', 'id']
            }
          }
        }
      },
      query: {
        path: '/artists',
        options: {
          method: 'POST'
        },
        schema: {
          type: 'object',
          properties: {
            ids: {
              type: 'array',
              items: {
                type: 'number'
              }
            }
          }
        }
      },
      search: {
        path: '/artists',
        schema: {
          type: 'object',
          properties: {
            q: {
              type: 'string'
            }
          }
        }
      },
      findOne: {
        path: '/artists/[:uid]',
        schema: {
          type: 'object',
          properties: {
            uid: {
              type: 'number'
            }
          }
        }
      },
      getLinks: {
        path: '/artists/[:uid]/links',
        schema: {
          type: 'object',
          properties: {
            uid: {
              type: 'number'
            }
          }
        }
      },
      getLabel: {
        path: '/artists/[:uid]/label',
        schema: {
          type: 'object',
          properties: {
            uid: {
              type: 'number'
            }
          }
        }
      },
      getAlbums: {
        path: '/artists/[:uid]/albums',
        schema: {
          type: 'object',
          properties: {
            uid: {
              type: 'number'
            },
            limit: {
              type: 'number'
            },
            page: {
              type: 'number'
            }
          }
        }
      },
      getNewTracks: {
        path: '/artists/[:uid]/tracks/new',
        schema: {
          type: 'object',
          properties: {
            uid: {
              type: 'number'
            },
            limit: {
              type: 'number'
            }
          }
        }
      },
      getLatestRelease: {
        path: '/artists/[:uid]/albums/latest',
        schema: {
          type: 'object',
          properties: {
            uid: {
              type: 'number'
            },
            limit: {
              type: 'number'
            }
          }
        }
      },
      getTopTracks: {
        path: '/artists/[:uid]/tracks/top',
        schema: {
          type: 'object',
          properties: {
            uid: {
              type: 'number'
            },
            limit: {
              type: 'number'
            }
          }
        }
      },
      getTracks: {
        path: '/artists/[:uid]/tracks',
        schema: {
          type: 'object',
          properties: {
            uid: {
              type: 'number'
            },
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
    tracklists: {
      get: {
        path: '/tracklists/[:type]',
        schema: {
          type: 'object',
          properties: {
            type: {
              type: 'string'
            },
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
      search: {
        path: '/tracks',
        schema: {
          type: 'object',
          properties: {
            q: {
              type: 'string'
            }
          }
        }
      },
      findOne: {
        path: '/tracks/[:id]',
        schema: {
          type: 'object',
          properties: {
            id: {
              type: 'number'
            }
          }
        }
      },
      get: {
        path: '/tracks',
        schema: {
          type: 'object',
          properties: {
            limit: {
              type: 'number'
            }
          }
        }
      }
    }
  }, Object.assign(defaultOptions, options))
}

module.exports = generateApi
