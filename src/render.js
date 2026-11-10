// Writes the README of one language from the list data, the translations and the short links.
import { BADGES_URL } from './badges.js'
import { LANGUAGES } from './languages.js'

const shield = text => encodeURIComponent(text.replace(/-/g, '--').replace(/_/g, '__'))
const badge = (label, message, color = '111111') =>
    `https://img.shields.io/badge/${shield(label)}-${shield(message)}-${color}?style=flat-square`
const single = (text, color, style) => `https://img.shields.io/badge/${shield(text)}-${color}?style=${style}`

// GitHub's heading anchor: lowercase; letters (with their combining marks, as in Hindi), numbers,
// spaces and hyphens kept; spaces to hyphens.
const anchor = text => text.toLowerCase().replace(/[^\p{L}\p{M}\p{N}\s-]/gu, '').trim().replace(/\s/g, '-')

export function render({ code, list, ui, t, link, lists, portfolio, updated }) {
    const tr = text => t(code, text)
    const count = list.categories.reduce((n, c) => n + c.items.length, 0)
    const out = []

    out.push(`# ${list.title}`, '')
    out.push(`> ${tr(list.description)}`, '')

    out.push(
        [
            `[![Cartas do Ciro](${badge('Cartas do Ciro', tr('assinar'))})](${link('cartas')})`,
            `[![YouTube](${badge('YouTube', '@ciro-maciel')})](${link('youtube')})`,
            `[![Instagram](${badge('Instagram', 'ciro.maciel')})](${link('instagram')})`,
            `[![Awesome](https://awesome.re/badge-flat2.svg)](${link('awesome')})`,
            `[![${ui.feed}](${badge('RSS', 'feed', '555555')})](feed/${code}.xml)`,
            `![${count} ${tr(ui.items)}](${badge(tr(ui.items), String(count), '555555')})`,
        ].join(' '),
        '',
    )

    out.push(
        LANGUAGES.map(l => `[![${l.label}](${BADGES_URL}/${l.code}${l.code === code ? '-on' : ''}.svg)](${l.file})`).join(' '),
        '',
    )

    out.push(tr(list.intro), '')

    out.push(`## ${tr(ui.contents)}`, '')
    for (const category of list.categories) out.push(`- [${tr(category.title)}](#${anchor(tr(category.title))})`)
    for (const key of ['legend', 'contribute', 'otherLists', 'madeBy', 'license']) out.push(`- [${tr(ui[key])}](#${anchor(tr(ui[key]))})`)
    out.push('')

    for (const category of list.categories) {
        out.push(`## ${tr(category.title)}`, '')
        if (category.description) out.push(tr(category.description), '')
        for (const item of category.items) {
            const tags = [...(item.tags ?? []), ...(item.ours ? ['do-autor'] : [])]
                .map(tag => `\`${tr(ui.tags[tag] ?? tag)}\``)
                .join(' ')
            out.push(`- [${item.name}](${link(item.url)}) - ${tr(item.description)}${tags ? ` ${tags}` : ''}`)
        }
        out.push('')
    }

    out.push(`## ${tr(ui.legend)}`, '', tr(ui.legendText), '')
    out.push(`## ${tr(ui.contribute)}`, '', tr(ui.contributeText), '', `[CONTRIBUTING.md](CONTRIBUTING.md)`, '')

    const sisters = lists.filter(l => l.live && l.slug !== list.slug)
    out.push(`## ${tr(ui.otherLists)}`, '', tr(ui.otherListsText), '')
    if (sisters.length) for (const s of sisters) out.push(`- [${s.title}](${link(`list:${s.slug}`)}) - ${tr(s.description)}`)
    out.push('')

    out.push(`## ${tr(ui.madeBy)}`, '', tr(ui.madeByText), '')
    out.push(portfolio.map(p => `[![${p.name}](${single(p.name, '111111', 'flat-square')})](${link(`portfolio:${p.name}`)})`).join(' '), '')

    out.push(`## ${tr(ui.license)}`, '', tr(ui.licenseText), '')
    out.push(`<sub>${tr(ui.updated)} ${updated}.</sub>`, '')
    return out.join('\n')
}
