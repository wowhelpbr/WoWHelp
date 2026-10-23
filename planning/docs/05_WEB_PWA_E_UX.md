# 05 | Web, mobile e UX

## Estratégia

Uma única base Next.js com design responsivo, UX mobile first e PWA. Aplicativos nativos seriam uma iniciativa separada, condicionada a uso e feedback. Não prometer acesso ao diretório de addons, arquivos do jogo ou sincronização local pelo celular.

## Mapa de navegação

```text
Home / Discover
  Search
  Mount catalog
  Beginner guides
My Account
  Characters
  Collections
  My goals
  Weekly planner
  Data connections
  Import addon data
Settings
  Language
  Privacy and data
  Battle.net disconnect
```

## Primeiras telas

1. Home pública: busca, categorias, objetivos comuns, CTA de vinculação.
2. Dashboard: personagem selecionado, coleção, 3 próximas ações, tarefas e freshness badges discretos.
3. Montaria: imagem autorizada, ID, disponibilidade, requisitos, passos, fonte e última checagem.
4. Meus objetivos: filtro por tempo, origem, personagem e conclusão.
5. Planejador: escolha de 15 / 30 / 60 / 120+ min, seleção de objetivos, sequência sugerida e justificativa.
6. Importação: instruções /reload, seleção de SavedVariables, preview de conteúdo, confirmação e resultado.
7. Connection center: conectar, atualizar e desvincular Battle.net com status de erros.

## Mobile

* Navegação principal com tab bar ou menu compacto sem esconder ações importantes.
* Toque mínimo confortável e contrastes AA.
* Checklists fáceis de marcar enquanto joga em outro dispositivo.
* Não depender de hover, arrastar ou telas largas.
* PWA instalável com ícones, manifest, tela offline para conteúdo público não sensível e política de atualização clara.
* Cache de páginas privadas e tokens sempre tratado com cautela; nunca salvar credenciais em cache público.
* Notificações push não entram no MVP. Se futuras, apenas mediante consentimento explícito.

## Idiomas e conteúdo

Rota ou estratégia clara de locale. en-US como principal; pt-BR como localização cultural produzida editorialmente. Nomes de quests, classes e itens podem precisar preservar nomenclatura oficial da localização do jogo. Evitar misturar traduções comunitárias e identificadores técnicos.

## SEO

Páginas públicas de montarias, guias e ferramentas com metadados corretos, hreflang, sitemap, canonical, schema markup aplicável e conteúdo único. Dashboard de usuário com noindex. Não usar conteúdo copiado de Wowhead nem abuso de páginas SEO em massa.

## Estados UX obrigatórios

Loading, empty, unauthenticated, permission-denied, stale, not-available, unknown e sync-failed precisam ter representações distintas. Dados desconhecidos nunca aparecem como 'faltando'.
