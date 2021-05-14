const apiFactoryGenerator = require('@resonate/api-factory-generator')
const TrackGroupItemSchema = {
  type: 'object',
  required: ['track_id'],
  properties: {
    track_id: {
      type: 'number'
    },
    title: {
      type: 'string'
    },
    index: {
      type: 'number',
      minimum: 1
    }
  }
}

/**
 * REST API configuration
 * @param {object} options Options for apiFactoryGenerator
 */
const generateApi = (opts = {}) => {
  const defaultOptions = {
    scheme: 'https://',
    domain: process.env.API_DOMAIN || 'api.resonate.localhost',
    prefix: (process.env.API_PREFIX || '') + '/v' + (opts.version || 1),
    auth: true,
    version: 1
  }

  const options = Object.assign({}, defaultOptions, opts)

  return apiFactoryGenerator({
    1: {
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
          collection: {
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
        logout: {
          path: '/oauth2/logout'
        },
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
          path: '/labels/[:id]',
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
          path: '/labels/[:id]/links',
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
          path: '/labels/[:id]/artists',
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
          path: '/labels/[:id]/albums',
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
    },
    2: {
      search: {
        query: {
          path: '/search',
          schema: {
            type: 'object',
            properties: {
              q: {
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
      tag: {
        query: {
          path: '/tag/[:tag]',
          schema: {
            type: 'object',
            properties: {
              tag: {
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
      labels: {
        findOne: {
          path: '/labels/[:id]',
          schema: {
            type: 'object',
            properties: {
              id: {
                type: 'number'
              }
            }
          }
        },
        getAlbums: {
          path: '/labels/[:id]/albums',
          schema: {
            type: 'object',
            properties: {
              id: {
                type: 'number'
              },
              various: {
                type: 'boolean'
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
        getReleases: {
          path: '/labels/[:id]/releases',
          schema: {
            type: 'object',
            properties: {
              id: {
                type: 'number'
              },
              limit: {
                type: 'number'
              },
              page: {
                type: 'number'
              },
              order: {
                type: 'string',
                enum: ['oldest', 'newest']
              }
            }
          }
        }
      },
      artists: {
        getReleases: {
          path: '/artists/[:id]/releases',
          schema: {
            type: 'object',
            properties: {
              id: {
                type: 'number'
              },
              limit: {
                type: 'number'
              },
              page: {
                type: 'number'
              },
              order: {
                type: 'string',
                enum: ['oldest', 'newest']
              }
            }
          }
        },
        getTopTracks: {
          path: '/artists/[:id]/tracks/top',
          schema: {
            type: 'object',
            properties: {
              id: {
                type: 'number'
              },
              limit: {
                type: 'number'
              }
            }
          }
        },
        findOne: {
          path: '/artists/[:id]',
          schema: {
            type: 'object',
            properties: {
              id: {
                type: 'number'
              }
            }
          }
        },
        find: {
          path: '/artists',
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
      resolve: {
        path: '/resolve',
        schema: {
          type: 'object',
          properties: {
            url: {
              type: 'string'
            }
          }
        }
      },
      trackgroups: {
        findOne: {
          path: '/trackgroups/[:id]',
          schema: {
            type: 'object',
            required: ['id'],
            properties: {
              id: {
                type: 'string',
                format: 'uuid'
              }
            }
          }
        }
      },
      user: {
        getProfile: {
          path: '/user/profile'
        },
        trackgroups: {
          addItems: {
            path: '/user/trackgroups/[:id]/items/add',
            options: {
              method: 'PUT'
            },
            schema: {
              type: 'object',
              additionalProperties: false,
              required: ['tracks'],
              properties: {
                id: {
                  type: 'string',
                  format: 'uuid'
                },
                tracks: {
                  type: 'array',
                  items: TrackGroupItemSchema
                }
              }
            }
          },
          removeItems: {
            path: '/user/trackgroups/[:id]/items/remove',
            options: {
              method: 'PUT'
            },
            schema: {
              type: 'object',
              additionalProperties: false,
              required: ['tracks'],
              properties: {
                id: {
                  type: 'string',
                  format: 'uuid'
                },
                tracks: {
                  type: 'array',
                  items: {
                    type: 'object',
                    required: ['track_id'],
                    properties: {
                      track_id: {
                        type: 'number'
                      }
                    }
                  }
                }
              }
            }
          },
          updatePrivacy: {
            path: '/user/trackgroups/[:id]/privacy',
            options: {
              method: 'PUT'
            },
            schema: {
              type: 'object',
              additionalProperties: false,
              properties: {
                id: {
                  type: 'string',
                  format: 'uuid'
                },
                private: {
                  type: 'boolean'
                }
              }
            }
          },
          create: {
            path: '/user/trackgroups',
            options: {
              method: 'POST'
            },
            schema: {
              type: 'object',
              additionalProperties: false,
              required: ['title'],
              properties: {
                title: {
                  type: 'string'
                },
                type: {
                  type: 'string',
                  enum: ['playlist']
                },
                cover: {
                  type: 'string',
                  format: 'uuid'
                },
                release_date: {
                  type: 'string',
                  format: 'date'
                },
                about: {
                  type: 'string'
                }
              }
            }
          },
          update: {
            path: '/user/trackgroups/[:id]',
            options: {
              method: 'PUT'
            },
            schema: {
              type: 'object',
              additionalProperties: false,
              properties: {
                id: {
                  type: 'string',
                  format: 'uuid'
                },
                cover: {
                  type: 'string',
                  format: 'uuid'
                },
                release_date: {
                  type: 'string',
                  format: 'date'
                },
                private: {
                  type: 'boolean'
                },
                type: {
                  type: 'string',
                  enum: ['playlist']
                },
                title: {
                  type: 'string'
                },
                about: {
                  type: 'string'
                }
              }
            }
          },
          findOne: {
            path: '/user/trackgroups/[:id]',
            schema: {
              type: 'object',
              required: ['id'],
              properties: {
                id: {
                  type: 'string',
                  format: 'uuid'
                }
              }
            }
          },
          find: {
            path: '/user/trackgroups',
            schema: {
              type: 'object',
              properties: {
                type: {
                  type: 'string',
                  enum: ['playlist', 'ep', 'lp', 'single'],
                  default: 'playlist'
                },
                order: {
                  type: 'string',
                  enum: ['random', 'oldest', 'newest']
                },
                includes: {
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
      tracks: {
        getLatest: {
          path: '/tracks/latest',
          schema: {
            type: 'object',
            properties: {
              limit: {
                type: 'number',
                minimum: 1
              },
              page: {
                type: 'number',
                minimum: 1
              }
            }
          }
        },
        find: {
          path: '/tracks',
          schema: {
            type: 'object',
            properties: {
              order: {
                type: 'string',
                enum: [
                  'oldest',
                  'newest',
                  'random'
                ]
              },
              limit: {
                type: 'number',
                minimum: 1
              },
              page: {
                type: 'number',
                minimum: 1
              }
            }
          }
        },
        findOne: {
          path: '/tracks/[:id]',
          schema: {
            type: 'object',
            required: ['id'],
            properties: {
              id: {
                type: 'number'
              }
            }
          }
        }
      },
      users: {
        findOne: {
          path: '/users/[:id]',
          schema: {
            type: 'object',
            properties: {
              id: {
                type: 'number'
              }
            }
          }
        },
        playlists: {
          find: {
            path: '/users/[:id]/playlists',
            schema: {
              type: 'object',
              properties: {
                id: {
                  type: 'number'
                }
              }
            }
          }
        }
      },
      releases: {
        find: {
          path: '/trackgroups',
          schema: {
            type: 'object',
            properties: {
              featured: {
                type: 'boolean'
              },
              limit: {
                minimum: 1,
                maximum: 100,
                type: 'number'
              },
              page: {
                type: 'number'
              },
              type: {
                type: 'string',
                enum: [
                  'ep',
                  'lp',
                  'single'
                ]
              }
            }
          }
        },
        findOne: {
          path: '/trackgroups/[:id]',
          schema: {
            type: 'object',
            required: ['id'],
            properties: {
              id: {
                type: 'string',
                format: 'uuid'
              }
            }
          }
        }
      },
      favorites: {
        resolve: {
          path: '/user/favorites/resolve',
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
                },
                uniqueItems: true,
                minItems: 1
              }
            }
          }
        }
      },
      plays: {
        resolve: {
          path: '/user/plays/resolve',
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
                },
                uniqueItems: true,
                minItems: 1
              }
            }
          }
        },
        stats: {
          path: '/user/plays/stats',
          schema: {
            type: 'object',
            properties: {
              period: {
                type: 'string',
                enum: ['yearly', 'daily', 'monthly']
              },
              from: {
                format: 'date'
              },
              to: {
                format: 'date'
              }
            }
          }
        },
        history: {
          artists: {
            path: '/user/plays/history/artists',
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
        }
      }
    }
  }[options.version], options)
}

module.exports = generateApi
