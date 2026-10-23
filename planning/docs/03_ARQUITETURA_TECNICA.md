# 03 | Arquitetura técnica

## Stack escolhida

| Camada | Escolha | Justificativa |
| --- | --- | --- |
| Frontend | Next.js App Router, React, TypeScript | SSR, páginas públicas indexáveis, rotas seguras e experiência PWA |
| UI | Tailwind CSS + biblioteca acessível | Consistência de componentes e responsividade |
| Backend | Supabase Postgres, Auth e Storage privado quando necessário | Dados estruturados, autorização por usuário e operações gerenciadas |
| Infra | Vercel | Deploys de preview por PR e ambiente de produção separado |
| Jobs | Supabase Cron/Edge Functions ou scheduler confiável validado | Sync assíncrono sob quotas e sem bloquear experiência |
| Addon | Lua e TOC World of Warcraft Retail | Compatível com a arquitetura de addon do jogo |
| Analytics | eventos próprios com identificadores pseudonimizados | Medir sucesso do produto sem registrar dados sensíveis em analytics |
| Testes | Vitest, Playwright, testes SQL de RLS | Cobrir lógica, UI e isolamento de dados |

## Fluxo lógico

```text
Navegador desktop / PWA mobile
        |
        | HTTPS
        v
Next.js em Vercel (UI + server routes)
        |
        +--> Supabase Auth (usuário WoWHelp)
        +--> Supabase Postgres (RLS, objetivos, conteúdo, progresso)
        +--> Battle.net OAuth/API (somente backend, consentimento)
        +--> Serviço de importação de snapshot (arquivo enviado com consentimento)

WoW addon Lua -> SavedVariables locais -> upload manual -> parser seguro -> snapshot normalizado -> Postgres
```

## Limites de confiança

1. Browser apresenta dados e envia comandos de usuário; não obtém segredos de integração.
2. Server routes verificam usuário autenticado, dono do recurso, schema do payload, limite de tamanho e quota.
3. Conector Battle.net guarda tokens apenas em camada restrita de servidor, preferindo cifragem com rotação e acesso mínimo.
4. Banco expõe via API somente tabelas RLS com GRANTs estritos; schema privado para segredos e auditoria.
5. Importação de addon trata arquivo Lua como dado não confiável. Nunca eval, loadstring ou execução de código enviado.

## Organização proposta

```text
apps/web/
  app/[locale]/
  app/api/
  components/
  features/{characters,collections,planner,imports}/
  lib/{auth,battlenet,db,validation}/
packages/shared/
  schemas/
  domain/
  i18n/
addon/WoWHelpCompanion/
supabase/migrations/
tests/{unit,e2e,security}/
docs/
```

## Autenticação

Adotar Supabase Auth para sessão principal do site. Vincular Battle.net por OAuth separado e associar a conta ao usuário existente. Não presumir que Battle.net é um social provider nativo do Supabase. Custom OAuth provider da Supabase pode ser investigado, porém **vincular** uma conta à identidade WoWHelp não exige que ela seja a autenticação primária. Usar HTTPS, redirect whitelist, verificação de state, PKCE quando compatível, política de consentimento e rotina de revogação.

## Estratégia de sincronização

1. Cada fonte declara `source`, `source_updated_at`, `fetched_at` e qualidade do dado.
2. Tarefas idempotentes por usuário, região, conta e entidade.
3. Backoff exponencial com jitter para 429 e 5xx, sem tempestade de retries.
4. Filas lógicas ou job table com estado, contagem de tentativas e limite por conta.
5. Exibição explícita de última atualização e possibilidade de solicitar novo sync com rate limiting.
6. Separar atualizações editoriais das atualizações da coleção dos usuários.

## Segurança e privacidade

* RLS em todas as tabelas expostas; policy ownership com `auth.uid()`.
* Service role e segredos nunca em `NEXT_PUBLIC_` ou em cliente.
* Validação de autorização na route mesmo que a tabela tenha RLS.
* Consultas parametrizadas, Zod ou contrato equivalente e proteção CSRF em mutações adequadas ao contexto.
* Storage privado por usuário; limite de payload e retenção curta para arquivos de importação.
* Políticas para exclusão/exportação de dados, autorização Battle.net e auditoria de sync.
* Content Security Policy, dependências fixadas e lockfile versionado.

## Ambientes

`local`: Supabase local via CLI quando disponível. `preview`: Vercel e Supabase staging, nunca copiar dados reais sem autorização. `production`: projeto e secrets isolados, domínio verificado depois da aprovação. Migrations através de PR e validação prévia de advisors.

## Custos e limites

Monitorar chamadas Battle.net, invocações serverless, banco, storage, egress e retenção de logs. Não presumir que planos gratuitos comportam usuários reais sem orçamento. Definir limite de gasto e alertas antes de beta aberto.
