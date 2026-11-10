// Draws the language badges of the README's language row: the flag and the language's own name,
// in the gray of the design system, 28px high like shields.io's for-the-badge. Shields could not
// be used here: it stretches every letter to a fixed width, which breaks scripts whose letters join
// (Hindi, Arabic). These SVGs leave the text to the browser, so every script shapes as it should.
// Run: bun src/badges.js   (writes badges/<code>.svg and badges/<code>-on.svg; commit them)
import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { FLAGS } from './flags.js'
import { LANGUAGES } from './languages.js'

const KIT = new URL('..', import.meta.url).pathname
export const BADGES_URL = 'https://raw.githubusercontent.com/ciro-maciel/awesome-kit/main/badges'

const COLORS = { off: '#111111', on: '#6b6b6b' }
const HEIGHT = 28
const FLAG = { x: 12, w: 21, h: 14 }
const TEXT_X = FLAG.x + FLAG.w + 9
const PAD_RIGHT = 14

// Scripts that join or have no case keep their letters as written; Latin and Cyrillic go upper case
// with the wide tracking of the reference row.
const isSpaced = label => /^[\p{Script=Latin}\p{Script=Cyrillic}\s]+$/u.test(label)

// A width the text fits in, without measuring a font: per character, by script, generous on purpose
// (a little air at the end reads fine; a clipped name does not).
function widthOf(label) {
    let width = 0
    for (const char of label) {
        if (/\p{Script=Han}|\p{Script=Hiragana}|\p{Script=Katakana}|\p{Script=Hangul}/u.test(char)) width += 12
        else if (/\p{Script=Devanagari}/u.test(char)) width += 7
        else if (/\p{Script=Arabic}/u.test(char)) width += 5.5
        else if (char === ' ') width += 5
        else width += isSpaced(label) ? 10 : 7.5
    }
    return Math.ceil(width)
}

const escape = text => text.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')

export function badgeSvg(language, isCurrent) {
    const label = isSpaced(language.label) ? language.label.toUpperCase() : language.label
    const width = TEXT_X + widthOf(label) + PAD_RIGHT
    const flag = FLAGS[language.code]
    const spacing = isSpaced(language.label) ? ' letter-spacing="1.6"' : ''
    return `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${width}" height="${HEIGHT}" role="img" aria-label="${escape(language.label)}">
<title>${escape(language.label)}</title>
<rect width="${width}" height="${HEIGHT}" fill="${isCurrent ? COLORS.on : COLORS.off}"/>
<image x="${FLAG.x}" y="${(HEIGHT - FLAG.h) / 2}" width="${FLAG.w}" height="${FLAG.h}" preserveAspectRatio="none" xlink:href="data:image/png;base64,${flag.png}" href="data:image/png;base64,${flag.png}"/>
<text x="${TEXT_X}" y="18.5" fill="#ffffff" font-family="Verdana,'DejaVu Sans','Segoe UI','Noto Sans','Noto Sans Devanagari','Noto Sans Arabic',sans-serif" font-size="11" font-weight="700"${spacing}>${escape(label)}</text>
</svg>
`
}

if (import.meta.main) {
    const dir = join(KIT, 'badges')
    mkdirSync(dir, { recursive: true })
    for (const language of LANGUAGES) {
        writeFileSync(join(dir, `${language.code}.svg`), badgeSvg(language, false))
        writeFileSync(join(dir, `${language.code}-on.svg`), badgeSvg(language, true))
    }
    console.log(`ok badges: ${LANGUAGES.length * 2} files in badges/`)
}
