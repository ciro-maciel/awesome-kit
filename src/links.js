// Every link a list prints goes through Links (go.mymarketing.click), one per destination, so each
// click is counted by list and item. links.json keeps destination -> short link, so a build only
// creates what is new. Without LINKS_KEY the destination is printed as it is.
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const API = 'https://links.worker.mymarketing.click'
const PER_MINUTE = 30

export const slugify = text =>
    text
        .normalize('NFD')
        .replace(/[̀-ͯ]/g, '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')

// The 30-per-minute limit is per account, shared with every other build and script that creates
// links at the same time: a 429 waits and tries again (up to five times, longer each time) instead
// of failing the build.
async function call(path, init = {}) {
    for (let attempt = 1; ; attempt++) {
        const response = await fetch(API + path, {
            ...init,
            headers: { authorization: `Bearer ${process.env.LINKS_KEY}`, 'content-type': 'application/json', ...init.headers },
        })
        const body = await response.json().catch(() => ({}))
        if (response.status === 429 && attempt <= 5) {
            const wait = Number(response.headers.get('retry-after')) * 1000 || attempt * 15000
            console.warn(`! Links ${path}: 429, waiting ${wait / 1000}s (attempt ${attempt})`)
            await new Promise(resolve => setTimeout(resolve, wait))
            continue
        }
        if (!response.ok) throw new Error(`Links ${path}: ${response.status} ${body.error?.message ?? ''}`)
        return body
    }
}

async function freeSlug(base) {
    for (let n = 1; n < 20; n++) {
        const slug = (n === 1 ? base : `${base.slice(0, 37)}-${n}`).slice(0, 40).replace(/-+$/, '')
        const check = await call(`/api/slugs?slug=${slug}`)
        if (check.available) return slug
    }
    throw new Error(`no free address for ${base}`)
}

// wanted: [{ destination, slug, piece }]. campaign: the list's campaign name, e.g. "awesome-pix".
export async function shortLinks(dir, campaign, wanted) {
    const file = join(dir, 'links.json')
    const known = existsSync(file) ? JSON.parse(readFileSync(file, 'utf8')) : {}
    if (!process.env.LINKS_KEY) {
        console.warn('! LINKS_KEY missing: links are printed without Links')
        return url => known[url]?.shortUrl ?? url
    }
    let created = 0
    for (const item of wanted) {
        if (known[item.destination]) continue
        const slug = await freeSlug(item.slug)
        const link = await call('/api/links', {
            method: 'POST',
            body: JSON.stringify({ destination: item.destination, slug, campaign, channel: 'other', piece: item.piece?.slice(0, 80) }),
        })
        known[item.destination] = { id: link.id, shortUrl: link.shortUrl }
        writeFileSync(file, JSON.stringify(known, null, 2) + '\n')
        created++
        await new Promise(resolve => setTimeout(resolve, Math.ceil(60000 / PER_MINUTE)))
    }
    if (created) console.log(`ok Links: ${created} new links in ${campaign}`)
    return url => known[url]?.shortUrl ?? url
}
