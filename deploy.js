import { readdir, readFile } from 'fs/promises'
import { dirname } from 'path'

const root = process.env.APPS_ROOT || await dirname(import.meta.dirname)

import { exec } from 'child_process'
const pkgName = import.meta.dirname.split('/').pop()
await Promise.all((await readdir(root)).map(async (_) => {
  if (_ === pkgName) return
  try {
    let [ packageJSON ] = (await readdir(`${root}/${_}`)).filter((_) => _ === 'package.json')
    if (!packageJSON) { console.log(`[${_}] No package.json found.`); return }
    packageJSON = JSON.parse((await readFile(`${root}/${_}/package.json`)).toString())
    if (!(packageJSON.dependencies || {})[pkgName]) {
      console.log(`[${_}] Does not require ${pkgName}.`)
      return
    }
    await exec(`cd ${root}/${_}; rm -rf node_modules && npm i`)
    console.log(`[${_}] Updated ${pkgName}.`)
  } catch (_) {
  }
}))