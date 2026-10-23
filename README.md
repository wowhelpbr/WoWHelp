# WoWHelp

Assistente para jogadores de World of Warcraft Retail: o jogador escolhe o que quer fazer hoje, transforma isso em objetivos e passos curtos e vê de onde vem cada informação. Web responsiva, instalável como app (PWA), em inglês e português do Brasil.

**Status:** Fases 0 a 6 concluídas no código; o beta depende de revisão jurídica e dos testes reais listados no quadro. Prévia no ar em https://wowhelp.vercel.app (sem divulgação pública). O que depende de teste real (Battle.net, jogo) e de revisão jurídica está em [docs/a-fazer.md](docs/a-fazer.md).

## O que já funciona

- Home com a pergunta "What do you want to do today?" e escolha de objetivos (gear, montarias, conquistas, semanais, alts, classe, sessão, moradia).
- Conta WoWHelp (e-mail e senha, Supabase Auth) com páginas privadas protegidas.
- Painel do jogador: próximas ações, objetivos com checklist, áreas de foco e fontes de dados com data da última atualização.
- Battle.net (OAuth oficial): personagens e coleção de montarias da conta, apagados em 30 dias sem atualização.
- Catálogo de montarias com dados oficiais da Blizzard, busca, filtros e status coletada / não obtida / desconhecida.
- Planejador semanal (reset por região) e de sessão (15, 30, 60, 120+ minutos).
- Addon **WoWHelp Companion** (Lua) e importação segura do arquivo no site, com prévia, escolha do que importar e exclusão.
- Privacidade (LGPD): baixar meus dados, excluir conta, política de privacidade e termos (rascunhos em revisão).
- Inglês e português do Brasil em todas as telas, com troca de idioma.
- PWA: manifest, ícones, service worker restrito e página offline.
- Banco com RLS: cada conta só vê os próprios dados (testado com pgTAP e E2E).

## Estrutura

```text
apps/web/                 Next.js 16 (App Router), React 19, TypeScript, Tailwind v4
  src/app/[locale]/       Páginas por idioma (/en, /pt-br)
  src/features/           Um módulo por sistema: auth, goals, onboarding, profile,
                          battlenet, catalog, planner, addon, account, legal
  src/components/         UI compartilhada: ui/, layout/, brand/, pwa/
  src/i18n/               Rotas de idioma (next-intl)
  src/lib/                Supabase, Battle.net, URLs
  messages/               Textos en-US e pt-BR
  public/downloads/       Zip do addon (gerado por scripts/build-addon-zip.mjs)
  tests/unit, tests/e2e   Vitest e Playwright (+ axe para acessibilidade)
  scripts/                Importação da marca, capturas de tela, zip do addon
addon/WoWHelpCompanion/   Addon Lua do jogo (SavedVariables, sem internet)
packages/shared/          Domínio e contratos (enums, schemas Zod, regras puras,
                          leitor do arquivo do addon)
supabase/                 config.toml, migrations, testes pgTAP
docs/                     Relatórios de fase, decisões, design, pesquisa, quest log
planning/                 Pacote de planejamento original (não editar)
```

## Rodar localmente

Pré-requisitos: Node 22+ (testado no 24), Docker Desktop ligado.

1. Instale as dependências na raiz: `npm install`
2. Suba o banco local (portas 554xx, para não colidir com outros projetos): `npx supabase start`
3. Crie `apps/web/.env.local` a partir de `apps/web/.env.example`, com `API_URL`, `PUBLISHABLE_KEY` e `SECRET_KEY` de `npx supabase status -o env`.
4. Rode o site: `npm run dev` e abra http://localhost:3100

Sem os passos 2 e 3 o site abre normalmente, mas login e painel mostram "contas indisponíveis neste ambiente".

Mudou o addon? Rode `npm run addon:zip -w @wowhelp/web` para atualizar o zip de download (um teste confere).

## Testes

| Comando | O que testa |
| --- | --- |
| `npm test` | Unitários (domínio, leitor do addon contra arquivos maliciosos, traduções en/pt iguais, zip do addon) |
| `npx supabase test db` | Isolamento entre contas no banco (RLS) |
| `npm run build && npm run test:e2e` | Ponta a ponta no desktop e no celular, incluindo acessibilidade WCAG A/AA e Battle.net falsa |
| `npm run lint`, `npm run typecheck`, `npm run format:check` | Qualidade do código |
| `node apps/web/scripts/smoke-production.mjs` | Fumaça na produção: conta temporária passa pelos fluxos principais e é excluída no fim |

O CI (`.github/workflows/ci.yml`) roda tudo isso em cada PR.

## Documentação

- [Relatório da manhã de 24/10/2026](docs/relatorio-24-10-2026.md)
- [Quadro de tarefas](docs/a-fazer.md) e [decisões técnicas](docs/decisoes.md)
- [Fase 0: relatório](docs/fase-0/relatorio-fase-0.md), [cobertura de dados Battle.net e addon](docs/fase-0/cobertura-de-dados-battlenet-e-addon.md), [inventário de assets](docs/fase-0/inventario-de-assets.md)
- Relatórios: [Fase 1](docs/fase-1/relatorio-fase-1.md), [Fase 2](docs/fase-2/relatorio-fase-2.md), [Fase 3](docs/fase-3/relatorio-fase-3.md), [Fase 4](docs/fase-4/relatorio-fase-4.md), [Fase 5](docs/fase-5/relatorio-fase-5.md), [Fase 6](docs/fase-6/relatorio-fase-6.md)
- Operação: [resposta a incidentes](docs/operacao/resposta-a-incidentes.md), [backup e rollback](docs/operacao/backup-e-rollback.md), [plano de beta](docs/fase-6/plano-de-beta.md), [checklist legal](docs/fase-6/checklist-legal.md)
- [Addon WoWHelp Companion](addon/WoWHelpCompanion/README.md)
- [Identidade visual e pesquisa de layout](docs/design/identidade-visual.md)
- [Planejamento original](planning/README.md)

## Aviso

O WoWHelp é uma ferramenta feita por fãs, sem afiliação com a Blizzard Entertainment. World of Warcraft e Blizzard Entertainment são marcas da Blizzard Entertainment, Inc. Logo e ilustrações: Elianai dos Santos (eliz00r), com direitos cedidos ao projeto.
