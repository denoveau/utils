import Express, { json } from 'express'
import cors from 'cors'
import { createServer as createSecureServer } from 'https'
import { createServer } from 'http'
import { readFileSync } from 'fs'
import { constants } from 'crypto'

export default class Application {
  #app
  #certPath
  #keyPath
  #host
  constructor({ host='0.0.0.0', handlers = {}, certPath = '', keyPath = '' }) {
    this.#keyPath = keyPath
    this.#certPath = certPath
    this.#app = Express().use(json({ strict: true })).use(cors({ origin: '*'})).disable('x-powered-by')
    this.setupCrud(handlers)
  }
  start(/**@type{Number|null}*/ port) {
    port = isNaN(+port) ? (process.env.PORT  || 3000) : +port
    if (this.#certPath && this.#keyPath) {
      createSecureServer({
        key: readFileSync(this.#keyPath),
        cert: readFileSync(this.#certPath),
        secureOptions: constants.SSL_OP_NO_TLSv1 | constants.SSL_OP_NO_TLSv1_1,
      ciphers: 'TLS_AES_256_GCM_SHA384:TLS_CHACHA20_POLY1305_SHA256:TLS_AES_128_GCM_SHA256',
      honorCipherOrder: true
      }, this.#app).listen(port, this.#host, () => {
        console.log(`App listening at https://localhost:${port}`);
      });
    } else {
      createServer({}, this.#app).listen(port, this.#host, () => {
        console.log(`App listening at http://localhost:${port}`)
      })
    }
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
