# WoWHelp

Assistente para jogadores de World of Warcraft Retail: o jogador escolhe o que quer fazer hoje, transforma isso em objetivos e passos curtos e vê de onde vem cada informação. Web responsiva, instalável como app (PWA), em inglês e português do Brasil.

**Status:** Fases 0 e 1 em andamento (fundação). Nada publicado em produção. Veja [docs/fase-1/relatorio-fase-1.md](docs/fase-1/relatorio-fase-1.md).

## O que já funciona

- Home com a pergunta "What do you want to do today?" e escolha de objetivos (gear, montarias, conquistas, semanais, alts, classe, sessão, moradia).
- Conta WoWHelp (e-mail e senha, Supabase Auth) com páginas privadas protegidas.
- Painel do jogador: próximas ações, objetivos com checklist, áreas de foco, fontes de dados e estados honestos ("previsto para a fase X").
- Inglês e português do Brasil em todas as telas, com troca de idioma.
- PWA: manifest, ícones, service worker restrito e página offline.
- Banco com RLS: cada conta só vê os próprios dados (testado com pgTAP e E2E).

Integração Battle.net (Fase 2), catálogo de montarias (Fase 3), planejador semanal (Fase 4) e addon Companion (Fase 5) ainda não existem; o site diz isso onde for relevante.

## Estrutura

```text
apps/web/                 Next.js 16 (App Router), React 19, TypeScript, Tailwind v4
  src/app/[locale]/       Páginas por idioma (/en, /pt-br)
  src/features/           Um módulo por sistema: auth, goals, onboarding, catalog, profile
  src/components/         UI compartilhada: ui/, layout/, brand/, pwa/
  src/i18n/               Rotas de idioma (next-intl)
  src/lib/supabase/       Clientes Supabase (navegador, servidor, proxy)
  messages/               Textos en-US e pt-BR
  tests/unit, tests/e2e   Vitest e Playwright (+ axe para acessibilidade)
  scripts/                Importação da marca, capturas de tela
packages/shared/          Domínio e contratos (enums, schemas Zod, regras puras)
supabase/                 config.toml, migrations, testes pgTAP, template de e-mail
docs/                     Relatórios de fase, decisões, design, pesquisa
planning/                 Pacote de planejamento original (não editar)
```

## Rodar localmente

Pré-requisitos: Node 22+ (testado no 24), Docker Desktop ligado.

1. Instale as dependências na raiz: `npm install`
2. Suba o banco local (portas 554xx, para não colidir com outros projetos): `npx supabase start`
3. Crie `apps/web/.env.local` a partir de `apps/web/.env.example`, com `API_URL` e `PUBLISHABLE_KEY` de `npx supabase status -o env`.
4. Rode o site: `npm run dev` e abra http://localhost:3100

Sem o passo 2 e 3 o site abre normalmente, mas login e painel mostram "contas indisponíveis neste ambiente".

## Testes

| Comando | O que testa |
| --- | --- |
| `npm test` | Unitários (domínio, traduções en/pt iguais, proteção de redirecionamento) |
| `npx supabase test db` | Isolamento entre contas no banco (RLS) |
| `npm run build && npm run test:e2e` | Ponta a ponta no desktop e no celular, incluindo acessibilidade WCAG A/AA |
| `npm run lint`, `npm run typecheck`, `npm run format:check` | Qualidade do código |

O CI (`.github/workflows/ci.yml`) roda tudo isso em cada PR.

## Documentação

- [Decisões técnicas](docs/decisoes.md)
- [Fase 0: relatório](docs/fase-0/relatorio-fase-0.md), [cobertura de dados Battle.net e addon](docs/fase-0/cobertura-de-dados-battlenet-e-addon.md), [inventário de assets](docs/fase-0/inventario-de-assets.md)
- [Fase 1: relatório](docs/fase-1/relatorio-fase-1.md)
- [Identidade visual e pesquisa de layout](docs/design/identidade-visual.md)
- [Planejamento original](planning/README.md)

## Aviso

O WoWHelp é uma ferramenta feita por fãs, sem afiliação com a Blizzard Entertainment. World of Warcraft e Blizzard Entertainment são marcas da Blizzard Entertainment, Inc. Logo e ilustrações: Elianai dos Santos (eliz00r), com direitos cedidos ao projeto.
