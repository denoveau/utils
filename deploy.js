import { readdir, readFile } from 'fs/promises'
import { exec } from 'child_process'
const pkgName = import.meta.dirname.split('/').pop()
await Promise.all((await readdir('../')).map(async (_) => {
  if (_ === pkgName) return
  try {
    let [ packageJSON ] = (await readdir(`../${_}`)).filter((_) => _ === 'package.json')
    if (!packageJSON) { console.log(`No package.json found in ${_}`); return }
    packageJSON = JSON.parse((await readFile(`../${_}/package.json`)).toString())
    if (!(packageJSON.dependencies || {})[pkgName]) {
      console.log(`${_} does not require ${pkgName}. Skipping.`)
      return
    }
    console.log(`Updating ${_} for ${pkgName}`)
    await exec(`cd ../${_}; npm i`)
  } catch (_) { }
}))