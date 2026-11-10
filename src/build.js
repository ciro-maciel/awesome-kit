// Builds one awesome list: bun src/build.js <list-dir>
// Reads <list-dir>/data/list.json (Portuguese), translates it, routes every link through Links,
// and writes the README of each language, dist/<code>.json and feed/<code>.xml.
import { SUPPORT_TEXT } from './support-text.js'
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { LANGUAGES } from './languages.js'
import { translateAll, translator } from './translate.js'
import { shortLinks, slugify } from './links.js'
import { render } from './render.js'

const KIT = join(dirname(fileURLToPath(import.meta.url)), '..')
const DIR = resolve(process.argv[2] ?? '.')
const read = file => JSON.parse(readFileSync(file, 'utf8'))

const list = read(join(DIR, 'data', 'list.json'))
const ui = read(join(KIT, 'data', 'ui.json'))
const lists = read(join(KIT, 'data', 'lists.json'))
const portfolio = read(join(KIT, 'data', 'portfolio.json'))
const support = read(join(KIT, 'data', 'support.json'))
const prefix = list.linkPrefix
const ref = url => `${url}${url.includes('?') ? '&' : '?'}ref=${list.slug}`

// What each logical link points to, and the short address it asks Links for.
const targets = new Map([
    ['cartas', { destination: ref('https://ciromaciel.click/'), slug: `${prefix}-cartas`, piece: 'Cartas do Ciro' }],
    ['youtube', { destination: 'https://www.youtube.com/@ciro-maciel', slug: `${prefix}-youtube`, piece: 'YouTube' }],
    ['instagram', { destination: 'https://www.instagram.com/ciro.maciel', slug: `${prefix}-instagram`, piece: 'Instagram' }],
    ['awesome', { destination: 'https://awesome.re', slug: `${prefix}-awesome`, piece: 'awesome.re' }],
    ['apoie', { destination: support.url, slug: `${prefix}-apoie`, piece: 'Apoie (doação)' }],
])
for (const l of lists) {
    targets.set(`list:${l.slug}`, {
        destination: `https://github.com/ciro-maciel/${l.slug}`,
        slug: `${prefix}-lista-${l.slug.replace(/^awesome-/, '')}`,
        piece: l.title,
    })
}
for (const p of portfolio) {
    targets.set(`portfolio:${p.name}`, { destination: ref(p.url), slug: `${prefix}-por-${slugify(p.name)}`, piece: `Feito por: ${p.name}` })
}
for (const category of list.categories) {
    for (const item of category.items) {
        targets.set(item.url, { destination: item.url, slug: `${prefix}-${slugify(item.name)}`, piece: item.name })
    }
}

const strings = [
    list.description, list.intro, 'assinar', 'Apoie', 'um café', SUPPORT_TEXT,
    ...Object.values(ui).flatMap(v => (typeof v === 'string' ? [v] : Object.values(v))),
    ...lists.map(l => l.description),
    ...list.categories.flatMap(c => [c.title, c.description, ...c.items.map(i => i.description)]),
]
const t = translator(await translateAll(strings, join(DIR, 'i18n'), { glossary: list.glossary ?? '' }))

const short = await shortLinks(DIR, list.campaign, [...new Map([...targets.values()].map(v => [v.destination, v])).values()])
const link = key => short(targets.get(key)?.destination ?? key)

const added = list.categories.flatMap(c => c.items.map(i => i.added)).filter(Boolean).sort()
const updated = added.at(-1) ?? new Date().toISOString().slice(0, 10)

const escape = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
mkdirSync(join(DIR, 'dist'), { recursive: true })
mkdirSync(join(DIR, 'feed'), { recursive: true })

for (const language of LANGUAGES) {
    const code = language.code
    writeFileSync(join(DIR, language.file), render({ code, list, ui, t, link, lists, portfolio, updated }))

    const data = {
        slug: list.slug, language: code, title: list.title, description: t(code, list.description), updated,
        categories: list.categories.map(c => ({
            id: c.id, title: t(code, c.title),
            items: c.items.map(i => ({ name: i.name, url: i.url, link: link(i.url), description: t(code, i.description), tags: i.tags ?? [], ours: Boolean(i.ours), added: i.added })),
        })),
    }
    writeFileSync(join(DIR, 'dist', `${code}.json`), JSON.stringify(data, null, 2) + '\n')

    const recent = data.categories
        .flatMap(c => c.items.map(i => ({ ...i, category: c.title })))
        .sort((a, b) => (b.added ?? '').localeCompare(a.added ?? ''))
        .slice(0, 50)
    const feed = [
        '<?xml version="1.0" encoding="UTF-8"?>',
        '<rss version="2.0"><channel>',
        `<title>${escape(list.title)}</title>`,
        `<link>https://github.com/ciro-maciel/${list.slug}</link>`,
        `<description>${escape(data.description)}</description>`,
        `<language>${code}</language>`,
        ...recent.map(i => [
            '<item>',
            `<title>${escape(i.name)}</title>`,
            `<link>${escape(i.link)}</link>`,
            `<guid isPermaLink="false">${escape(list.slug + ':' + i.url)}</guid>`,
            `<category>${escape(i.category)}</category>`,
            `<description>${escape(i.description)}</description>`,
            i.added ? `<pubDate>${new Date(i.added + 'T12:00:00Z').toUTCString()}</pubDate>` : '',
            '</item>',
        ].join('')),
        '</channel></rss>',
        '',
    ].join('\n')
    writeFileSync(join(DIR, 'feed', `${code}.xml`), feed)
}
console.log(`ok ${list.slug}: ${LANGUAGES.length} READMEs, ${list.categories.reduce((n, c) => n + c.items.length, 0)} items`)
