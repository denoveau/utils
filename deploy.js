import { readdir, readFile } from 'fs/promises'
import { dirname } from 'path'

const currDir = import.meta.dirname
const root = process.env.APPS_ROOT || await dirname(currDir)

const utilsPkgJSON = JSON.parse((await readFile(`${currDir}/package.json`)).toString())
const { version } = utilsPkgJSON

import { exec } from 'child_process'
const pkgName = currDir.split('/').pop()
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
    await exec(`cd ${root}/${name}; git stash && rm -rf node_modules package-lock.json && npm i && git add package*json && git commit -m "Updates utils to v${version}." && git push origin $(git rev-parse --abbrev-ref HEAD) && git stash pop`)
    console.log(`[${name}] Updated ${pkgName}.`)
  } catch ({ message }) {
    console.log(`[${name}] Unable to update ${pkgName}. (${message})`)
  }
}))