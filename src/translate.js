// Translates the Portuguese strings of a list into every other language with Claude, once.
// Each language keeps a cache in i18n/<code>.json keyed by a hash of the Portuguese text, so a
// build only sends what is new or changed, and a reviewed translation is never overwritten.
import Anthropic from '@anthropic-ai/sdk'
import { zodOutputFormat } from '@anthropic-ai/sdk/helpers/zod'
import { z } from 'zod'
import { createHash } from 'node:crypto'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { LANGUAGES, SOURCE } from './languages.js'

const MODEL = 'claude-haiku-5-5'
const BATCH = 40

export const hashOf = text => createHash('sha1').update(text).digest('hex').slice(0, 16)

const Output = z.object({ translations: z.array(z.string()) })

function loadCache(dir, code) {
    const file = join(dir, `${code}.json`)
    return existsSync(file) ? JSON.parse(readFileSync(file, 'utf8')) : {}
}

function saveCache(dir, code, cache) {
    mkdirSync(dir, { recursive: true })
    const sorted = Object.fromEntries(Object.entries(cache).sort(([a], [b]) => a.localeCompare(b)))
    writeFileSync(join(dir, `${code}.json`), JSON.stringify(sorted, null, 2) + '\n')
}

async function translateBatch(client, texts, language, glossary) {
    const instructions = [
        `Translate each Brazilian Portuguese string of the JSON array into ${language.name}.`,
        'They are entries and headings of a curated "awesome" list read by people looking for tools.',
        'Keep product names, brand names, acronyms, code and URLs as they are. Keep it short and plain, the way a',
        'native speaker would write a list entry. Do not add or remove information. No emoji.',
        'House glossary: "etiqueta" is a label or tag on a list item (never a brand); "do autor" means made by the list\'s author.',
        glossary ? `Glossary: ${glossary}` : '',
        `Return {"translations": [...]} with exactly ${texts.length} strings, in the same order.`,
    ].filter(Boolean).join('\n')
    for (let attempt = 1; attempt <= 3; attempt++) {
        const response = await client.messages.parse({
            model: MODEL,
            max_tokens: 16000,
            output_config: { effort: 'low', format: zodOutputFormat(Output) },
            messages: [{ role: 'user', content: `${instructions}\n\n${JSON.stringify(texts)}` }],
        })
        const out = response.parsed_output?.translations
        if (out && out.length === texts.length) return out
        console.warn(`! ${language.code}: got ${out?.length ?? 'no'} strings for ${texts.length}, attempt ${attempt}`)
    }
    throw new Error(`translation to ${language.code} failed`)
}

// strings: the Portuguese texts the list needs. Returns { code: { hash: text } } for every language.
export async function translateAll(strings, dir, { glossary = '' } = {}) {
    const unique = [...new Set(strings.filter(Boolean))]
    const result = { [SOURCE]: Object.fromEntries(unique.map(text => [hashOf(text), text])) }
    const client = process.env.ANTHROPIC_API_KEY ? new Anthropic() : null
    for (const language of LANGUAGES.filter(l => l.code !== SOURCE)) {
        const cache = loadCache(dir, language.code)
        const missing = unique.filter(text => !cache[hashOf(text)])
        if (missing.length && !client) {
            console.warn(`! ${language.code}: ${missing.length} strings untranslated (no ANTHROPIC_API_KEY); Portuguese is shown`)
        }
        for (let i = 0; client && i < missing.length; i += BATCH) {
            const slice = missing.slice(i, i + BATCH)
            const out = await translateBatch(client, slice, language, glossary)
            slice.forEach((text, j) => (cache[hashOf(text)] = out[j]))
            saveCache(dir, language.code, cache)
        }
        if (missing.length && client) console.log(`ok ${language.code}: ${missing.length} new strings`)
        result[language.code] = cache
    }
    return result
}

// t(code, text): the translation of a Portuguese text, falling back to the text itself.
export const translator = table => (code, text) => (text ? table[code]?.[hashOf(text)] ?? text : text)
