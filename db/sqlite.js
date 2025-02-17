import { basename, dirname, resolve } from 'path'

function getCallerRoot() {
  const callerPath = new Error().stack.split('\n')[2].match(/file:\/\/([^\s)]+)/)?.[1];
  if (!callerPath) {
    return
  }
  return dirname(basename(callerPath))
}

import pkg from 'sqlite3';
import { promisify } from 'util';
const { Database } = pkg;

async function connect(dbName) {
  const root = resolve(getCallerRoot() || import.meta.dirname)
  const dbPath = `${root}/${dbName}.db`
  const db = new Database(dbPath);
  ['all', 'exec'].map((fn) => {
    db[fn] = promisify(db[fn]).bind(db)
  })
  return db
}


class Table {
  /**@type{String|null}*/ tableName
  /**@type{Database|null}*/ db
  static get table() { return (this.tableName || this.name).toLowerCase() }
  static async getData(data, parameterize = false) {
    const schema_ = await this.schema
    const keys = []
    const values = []
    Object.entries(data)
      .map(([key, value]) => {
        if (!schema_.fields[key]) return
        keys.push(parameterize ? `${key} = ?` : `${key}`)
        try { value = JSON.parse(value) } catch (err) { }
        values.push(value)
      })
    return [keys, values]
  }
  static get schema() {
    const root = this
    return new Promise(async (resolve) => {
      root.db = root.db || await connect(this.table)
      const metadata = {}
      const schema = Object.fromEntries((await root.db.all(`SELECT * FROM PRAGMA_TABLE_INFO('${this.table}');`)).map((row) => {
        const { name, type, notnull, dflt_value: defaultValue, pk } = row
        if (!!pk) { metadata.pk = name }
        return [name, { type, nullable: !!notnull, defaultValue, isPK: !!pk }]
      }))
      resolve({
        metadata,
        fields: schema
      })
    })
  }
  static async read({ query = {}, params = {}} = {}) {
    // TODO: Add a filter for restrictions
    query = { ...(params || {}), ...(query || {})}
    const [keys, values] = await this.getData(query, true)
    const filter = keys.length ? `where ${keys.join(' and ')}` : ''
    return this.db.all(`select * from ${this.table} ${filter}`, values)
  }
  static async create(data = {}) {
    const [keys, values] = await this.getData(data)
    if (!keys.length) {
      throw new Error("No valid data provided.")
    }
    try {
      const query = `insert into ${this.table}(${keys.join(',')}) values(${values.map((value) => `'${value}'`).join(',')})`
      await this.db.exec(query)
    } catch (error) {
      console.log({ error })
      throw new Error(`Error creating new ${this.table.slice(0, -1)}`)
    }
    return this.read({ query: data })
  }
  static async update(query = {}, data = {}) {
    const [keys, values] = await this.getData(query, true)
    const [updateKeys, updateValues] = await this.getData(data, true)
    if (!keys.length || !updateKeys.length) {
      throw new Error("No valid data provided.")
    }
    const dbQuery = `update ${this.table} set ${updateKeys.join(', ')} where ${keys.join(' and ')};`
    // FIXME: Schema based sanity and restricted field update checks.
    await this.db.all(dbQuery, [...updateValues, ...values])
    Object.entries(query).map(([key, value]) => Object.assign(query, { [key]: data[key] || value }))
    return this.read({ query })
  }
  static async delete(query = {}) {
    const { metadata : { pk } } = await this.schema
    if (!pk) { throw new Error("Refusing delete operation in the absence of an primary indexed field.") }
    if (!query[pk]) { throw new Error(`Invalid delete. Need ${pk} as part of query.`) }
    // // FIXME: Schema based sanity and restricted field update checks.
    const dbQuery = `delete from ${this.table} where ${pk} = ?`
    setTimeout(async () => {
      await this.db.all(dbQuery, [query[pk]])
      console.log(await this.read({ query }))
    }, 2000)
    return {}
  }
}

export default connect
export { Table }