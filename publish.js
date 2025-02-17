import { readFile, writeFile } from 'fs/promises'
import readline from 'readline'

function askQuestion(query) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  return new Promise((resolve) => {
    rl.question(query, (answer) => {
      rl.close();
      resolve(answer);
    });
  });
}

async function getVersionChoice() {
  console.log("Choose version change to publish:");
  console.log("m. Major");
  console.log("n. Minor");
  console.log("p. Patch");
  return askQuestion("");
}

const root = import.meta.dirname
const packageJSONFile = `${root}/package.json`
try {
  const packageJSON = JSON.parse((await readFile(packageJSONFile)).toString())
  let { version = '0.0.1' } = packageJSON
  let [major, minor, patch] = version.split('.')
  major = +major
  minor = +minor
  patch = +patch
  console.log(`Current version is ${version}`)

  let answer = await getVersionChoice()
  switch (answer) {
    case 'm':
      console.log("Bumping major version up.");
      major += 1
      break;
    case 'n':
        console.log("Bumping minor version up.");
        minor += 1
      break;
    case 'p':
      console.log("Bumping patch version up.");
      patch += 1
      break;
    default:
      console.log("Invalid choice. m, n, or p.");
      process.exit(1)
      // FIXME: Getting version choice again here doesn't increment the version.
  }
  const newVersion = `${major}.${minor}.${patch}`
  console.log(`New version is ${newVersion}`)
  Object.assign(packageJSON, { version: newVersion })
  await writeFile(packageJSONFile, JSON.stringify(packageJSON, null, 2))
} catch ({ message }) {
  console.log(`[ERROR] Unable to publish. (${message})`)
}