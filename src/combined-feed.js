// Joins the Portuguese feed of every live list into feed/all.xml, so one subscription follows all
// of them. Each item keeps its own link and guid; its category gets the list's title in front.
// Run: bun src/combined-feed.js   (the workflow cron-awesome-feed.yml runs it every day)
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const KIT = new URL('..', import.meta.url).pathname
const lists = JSON.parse(readFileSync(join(KIT, 'data', 'lists.json'), 'utf8')).filter(list => list.live)
const raw = slug => `https://raw.githubusercontent.com/ciro-maciel/${slug}/main/feed/pt.xml`
const escape = text => text.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')

const items = []
let missing = 0
for (const list of lists) {
    const response = await fetch(raw(list.slug))
    if (!response.ok) {
        console.warn(`! ${list.slug}: feed ${response.status}, left out this time`)
        missing++
        continue
    }
    const xml = await response.text()
    for (const [item] of xml.matchAll(/<item>[\s\S]*?<\/item>/g)) {
        const date = Date.parse(item.match(/<pubDate>([^<]+)<\/pubDate>/)?.[1] ?? '') || 0
        items.push({ date, xml: item.replace(/<category>/, `<category>${escape(list.title)} · `) })
    }
}
items.sort((a, b) => b.date - a.date)

const feed = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<rss version="2.0"><channel>',
    '<title>Listas awesome do Ciro Cesar Maciel</title>',
    '<link>https://ciromaciel.click/awesome</link>',
    `<description>O que entra em cada uma das ${lists.length} listas awesome, num feed só.</description>`,
    '<language>pt</language>',
    ...items.map(item => item.xml),
    '</channel></rss>',
    '',
].join('\n')
mkdirSync(join(KIT, 'feed'), { recursive: true })
writeFileSync(join(KIT, 'feed', 'all.xml'), feed)
console.log(`ok feed/all.xml: ${items.length} items from ${lists.length - missing} of ${lists.length} lists`)
