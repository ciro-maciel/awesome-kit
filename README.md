# awesome-kit

The generator behind Ciro Cesar Maciel's awesome lists. One file in Brazilian Portuguese goes in;
the README in 15 languages, an open JSON and an RSS feed per language come out.

[Português](README.pt-BR.md)

## What it does

- **Translates once.** Every Portuguese string is translated by Claude (Haiku) into 14 languages and
  kept in `i18n/<code>.json`, keyed by a hash of the source text. A build only sends what is new or
  changed, and a reviewed translation is never overwritten.
- **Counts clicks without cookies.** Every link the list prints goes through
  [Links](https://mymarketing.click/?ref=oss-awesome-kit), one short address per destination, so a
  list knows which item and which list brought each visit.
- **Writes everything from one source:** `README.md` (Portuguese), `README-<code>.md`,
  `dist/<code>.json` and `feed/<code>.xml`.

## Use it

```bash
bun install
bun src/new-list.js ../awesome-something   # copies the workflow, forms, CONTRIBUTING, AGENTS, CC0
bun src/build.js ../awesome-something      # needs data/list.json
```

`ANTHROPIC_API_KEY` and `LINKS_KEY` are optional: without them, the Portuguese text and the plain
links are printed. Each list runs the same build in GitHub Actions (`publish-list.yml`).

## The lists

`data/lists.json` is the registry. Every list links to the others that are live.

## License

MIT. The lists themselves are CC0.
