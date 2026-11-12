// Builds the npm package @ciromaciel/awesome-lists in .package/: every live list in all 15 languages,
// as the same JSON each list publishes in dist/<code>.json, plus index.json. Publishes only when the
// content changed: the package carries a hash of its lists, compared with the one already on npm.
// Run: bun src/package.js [--publish]   (the workflow cron-awesome-feed.yml runs it every day)
import { createHash } from 'node:crypto'
import { execSync } from 'node:child_process'
import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { LANGUAGES } from './languages.js'

const NAME = '@ciromaciel/awesome-lists'
const KIT = new URL('..', import.meta.url).pathname
const OUT = join(KIT, '.package')
const raw = (slug, path) => `https://raw.githubusercontent.com/ciro-maciel/${slug}/main/${path}`
const lists = JSON.parse(readFileSync(join(KIT, 'data', 'lists.json'), 'utf8')).filter(list => list.live)

rmSync(OUT, { recursive: true, force: true })
const hash = createHash('sha256')
const index = []
for (const list of lists) {
    const languages = []
    let count = 0
    let updated = ''
    for (const { code } of LANGUAGES) {
        const response = await fetch(raw(list.slug, `dist/${code}.json`))
        if (!response.ok) continue
        const text = await response.text()
        mkdirSync(join(OUT, 'lists', list.slug), { recursive: true })
        writeFileSync(join(OUT, 'lists', list.slug, `${code}.json`), text)
        hash.update(`${list.slug}/${code}\n${text}`)
        languages.push(code)
        if (code === 'pt') {
            const data = JSON.parse(text)
            count = data.categories.reduce((sum, category) => sum + category.items.length, 0)
            updated = data.updated
        }
    }
    if (!languages.length) {
        console.warn(`! ${list.slug}: no JSON yet, left out`)
        continue
    }
    index.push({ slug: list.slug, title: list.title, description: list.description, items: count, updated, languages, repository: `https://github.com/ciro-maciel/${list.slug}` })
}
const contentHash = hash.digest('hex').slice(0, 16)
writeFileSync(join(OUT, 'index.json'), JSON.stringify(index, null, 2) + '\n')

const now = new Date()
const stamp = now.toISOString().slice(0, 10).replaceAll('-', '')
const version = `1.${stamp}.${now.getUTCHours() * 100 + now.getUTCMinutes()}`
writeFileSync(
    join(OUT, 'package.json'),
    JSON.stringify(
        {
            name: NAME,
            version,
            description: 'Curated awesome lists in Brazilian Portuguese and 14 more languages, as JSON: AI at work by profession, Pix, NF-e, payments, Brazilian APIs and more.',
            license: 'CC0-1.0',
            author: 'Ciro Cesar Maciel (https://ciromaciel.click)',
            homepage: 'https://ciromaciel.click/awesome',
            repository: { type: 'git', url: 'git+https://github.com/ciro-maciel/awesome-kit.git' },
            keywords: ['awesome', 'awesome-list', 'brasil', 'brazil', 'pix', 'nfe', 'ai', 'json', 'dataset'],
            files: ['index.json', 'lists'],
            exports: { '.': './index.json', './index.json': './index.json', './lists/*': './lists/*' },
            awesomeHash: contentHash,
        },
        null,
        2,
    ) + '\n',
)
writeFileSync(
    join(OUT, 'README.md'),
    `# ${NAME}

The ${index.length} curated awesome lists of [Ciro Cesar Maciel](https://ciromaciel.click/awesome) as JSON, in Brazilian Portuguese and 14 more languages. CC0: use them however you like.

\`\`\`js
import lists from '${NAME}' with { type: 'json' }
import pix from '${NAME}/lists/awesome-pix/en.json' with { type: 'json' }
\`\`\`

- \`index.json\`: every list, with title, description, item count, last update and languages.
- \`lists/<slug>/<language>.json\`: one list in one language (\`pt\`, \`en\`, \`es\`, \`fr\`, \`de\`, \`it\`, \`ru\`, \`zh\`, \`ja\`, \`ko\`, \`hi\`, \`ar\`, \`id\`, \`tr\`, \`vi\`). Each item has its name, link, description, tags and whether the list's author made it.

Published again whenever a list changes. Lists: ${index.map(list => `[${list.slug}](${list.repository})`).join(', ')}.
`,
)
console.log(`ok .package: ${index.length} lists, hash ${contentHash}, version ${version}`)

if (process.argv.includes('--publish')) {
    let published = ''
    try {
        published = execSync(`npm view ${NAME} awesomeHash`, { encoding: 'utf8' }).trim()
    } catch {}
    if (published === contentHash) console.log('= nothing changed since the published version')
    else {
        execSync('npm publish --access public', { cwd: OUT, stdio: 'inherit' })
        console.log(`ok published ${NAME}@${version}`)
    }
}
