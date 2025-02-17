import Express, { json } from 'express'
import cors from 'cors'

const app = Express()


export class Application {
  #app
  constructor(handlers = {}) {
    this.#app = Express().use(json({ strict: true })).use(cors({ origin: '*'})).disable('x-powered-by')
    this.setupCrud(handlers)
  }
  start(/**@type{Number|null}*/ port) {
    port = isNaN(+port) ? (process.env.PORT  || 3000) : +port
    this.#app.listen(port, () => {
      console.log(`App listening at http://localhost:${port}`)
    })
    return this
  }
  setupCrud(handlers = {}) {
    const validMethods = ['get', 'put', 'post', 'patch', 'delete']
    Object.entries(handlers).filter(([method]) => {
      return validMethods.indexOf(method.toLocaleLowerCase()) !== -1
    }).map(([method, handler]) => {
      this.#app[method]('/', handler)
    })
    return this
  }
}

// app.use(json({ strict: true })).use(cors({ origin: '*'})).disable('x-powered-by')
app.start = (/**@type{Number|null}*/ port) => {
  port = isNaN(+port) ? (process.env.PORT  || 3000) : +port
  app.listen(port, () => {
    console.log(`App listening at http://localhost:${port}`)
  })
  return app
}
app.setupCrud = (handlers = {}) => {
  const validMethods = ['get', 'put', 'post', 'patch', 'delete']
  Object.entries(handlers).filter(([method]) => {
    return validMethods.indexOf(method.toLocaleLowerCase()) !== -1
  }).map(([method, handler]) => {
    app[method]('/', handler)
  })
  return app
}

export default app