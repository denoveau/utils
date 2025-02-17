import { readdir, readFile } from 'fs/promises'
import { dirname } from 'path'

const root = process.env.APPS_ROOT || await dirname(import.meta.dirname)

import { exec } from 'child_process'
const pkgName = import.meta.dirname.split('/').pop()
await Promise.all((await readdir(root, { withFileTypes: true })).filter(($) => {
  return $.isDirectory() && $.name !== pkgName
}).map(async ({ name }) => {
  try {
    let [ packageJSON ] = (
      await readdir(`${root}/${name}`)
    ).filter((name) => name === 'package.json')
    if (!packageJSON) { console.log(`[${name}] No package.json found.`); return }
    packageJSON = JSON.parse((await readFile(`${root}/${name}/package.json`)).toString())
    if (!(packageJSON.dependencies || {})[pkgName]) {
      return console.log(`[${name}] Does not require ${pkgName}.`)
    }
    await exec(`cd ${root}/${name}; rm -rf node_modules && npm i`)
    console.log(`[${name}] Updated ${pkgName}.`)
  } catch ({ message }) {
    console.log(`[${name}] Unable to update ${pkgName}. (${message})`)
  }
}))