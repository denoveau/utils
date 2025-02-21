import Express, { json } from 'express'
import cors from 'cors'

export default class Application {
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
