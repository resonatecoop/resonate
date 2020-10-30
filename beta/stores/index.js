module.exports = (app) => {
  app.use(require('./update')())
  app.use(require('./notifications')())
  app.use(require('./app')())
  app.use(require('./labels')())
  app.use(require('./artists')())
  app.use(require('./tracks')())
  app.use(require('./consent')())
  app.use(require('./player')())
  app.use(require('./search')())
}
