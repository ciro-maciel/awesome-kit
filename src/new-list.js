// Starts a list repository from the templates: bun src/new-list.js <list-dir>
// Copies the workflow, the issue forms, the pull request template, CONTRIBUTING, AGENTS, the curator
// skill and the CC0 license. data/list.json is written by hand: it is the list itself.
import { cpSync, existsSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const KIT = join(dirname(fileURLToPath(import.meta.url)), '..')
const DIR = resolve(process.argv[2] ?? '.')
if (!existsSync(join(DIR, 'data', 'list.json'))) throw new Error(`${DIR}/data/list.json is missing`)
cpSync(join(KIT, 'templates'), DIR, { recursive: true, force: false, errorOnExist: false })
console.log(`ok templates copied to ${DIR}`)
