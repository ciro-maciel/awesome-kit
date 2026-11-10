# awesome-kit

O gerador por trás das listas awesome do Ciro Cesar Maciel. Entra um arquivo em português do Brasil;
saem o README em 15 línguas, um JSON aberto e um RSS por língua.

[English](README.md)

## O que faz

- **Traduz uma vez só.** Cada texto em português é traduzido pelo Claude (Haiku) para 14 línguas e
  guardado em `i18n/<código>.json`, pela impressão digital do texto original. Um build só manda o que
  é novo ou mudou, e uma tradução revisada nunca é sobrescrita.
- **Conta cliques sem cookie.** Todo link da lista passa pelo
  [Links](https://mymarketing.click/?ref=oss-awesome-kit), um endereço curto por destino, e a lista
  sabe qual item e qual lista trouxe cada visita.
- **Escreve tudo de uma fonte só:** `README.md` (português), `README-<código>.md`,
  `dist/<código>.json` e `feed/<código>.xml`.

## Como usar

```bash
bun install
bun src/new-list.js ../awesome-alguma-coisa   # copia o workflow, os formulários, CONTRIBUTING, AGENTS e a CC0
bun src/build.js ../awesome-alguma-coisa      # precisa do data/list.json
```

`ANTHROPIC_API_KEY` e `LINKS_KEY` são opcionais: sem elas, sai o texto em português e os links diretos.
Cada lista roda o mesmo build no GitHub Actions (`publish-list.yml`).

## As listas

`data/lists.json` é o registro. Cada lista aponta para as outras que estão no ar.

## Licença

MIT. As listas são CC0.
