import { execSync } from 'child_process';
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


const localCommitCmd = `git --no-pager log origin/$(git rev-parse --abbrev-ref HEAD)..HEAD | grep Author`
const hasCommits = false
try {
  const commits = execSync(localCommitCmd).toString().split('\n').filter(($) => !!$)
  if (!commits.length) {
    console.log(`No local commits found to append on to and publish.`)
    process.exit(1)
  }
} catch ({ message }) {
  message = message.indexOf('Command failed') !== -1 ? message : 'Unable to get any commits locally.'
  console.log(`[ERROR] ${message}`)
  process.exit(1)
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
      minor = 0
      patch = 0
      break;
    case 'n':
        console.log("Bumping minor version up.");
        minor += 1
        patch = 0
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
  console.log(execSync(`git add package.json && git commit --amend --no-edit`).toString())
} catch ({ message }) {
  console.log(`[ERROR] Unable to publish. (${message})`)
}