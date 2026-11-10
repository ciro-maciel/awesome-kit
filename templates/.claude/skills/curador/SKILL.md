---
name: curador
description: Inclui, corrige ou remove itens desta lista awesome editando data/list.json no formato certo. Use quando pedirem para adicionar uma ferramenta, consertar um link quebrado ou tirar algo que saiu do ar.
---

# Curador da lista

1. Leia `data/list.json` e ache a categoria certa. Se nenhuma serve, pare e sugira abrir uma issue.
2. Confira que o item ainda não está na lista: procure pelo nome e pelo domínio do endereço.
3. Abra o endereço e confirme que ele responde hoje e faz o que a descrição vai dizer.
4. Escreva o item:
   - `name`: o nome que o próprio projeto usa.
   - `url`: a página oficial ou o repositório, nunca um encurtador ou uma revenda.
   - `description`: uma frase em português do Brasil dizendo o que faz. Sem "o melhor", sem emoji.
   - `tags`: só as que se aplicam, entre `oficial`, `codigo-aberto`, `gratis`, `pago`, `api`, `sdk`.
   - `added`: a data de hoje, `AAAA-MM-DD`.
5. Insira em ordem alfabética dentro da categoria e mantenha o JSON válido.
6. Não edite `README*.md`, `i18n/`, `links.json`, `dist/` nem `feed/`: o workflow regenera tudo.
7. Abra o pull request com o modelo do repositório. Se quem pediu faz parte do projeto, diga.
