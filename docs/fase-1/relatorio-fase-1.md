# Fase 1 | Fundação e Web/PWA: relatório

Data: 23/10/2026. Gate da fase (planning/docs/02): usuário autenticado cria e lê seus próprios objetivos; outro usuário não consegue ler esses registros; preview aprovado no celular e desktop.

## Situação do gate

| Critério | Situação | Evidência |
| --- | --- | --- |
| Usuário cria e lê os próprios objetivos | **Atendido** (local) | E2E `goals.spec.ts`: cria objetivo e passo, marca, recarrega, continua marcado |
| Outro usuário não lê esses registros | **Atendido** (local) | pgTAP 27/27 (`supabase/tests/database`) e E2E com duas contas em navegadores separados |
| Preview aprovado no celular e desktop | **Pendente**: precisa do projeto na Vercel e do aceite do Bruno | Capturas em `docs/screenshots/` (desktop 1366 px e Pixel 7) |

## Primeira entrega pedida

| # | Item | Situação |
| --- | --- | --- |
| 1 | Fundação Next.js e TypeScript | Feito: Next 16.4.2, React 19.3, TypeScript estrito, monorepo npm |
| 2 | Componentes reutilizáveis | Feito: botões, painel, campo, badges de estado de dado, aviso de estado, layout, marca |
| 3 | Identidade visual inicial | Feito: sistema HUD com cores do WoWHelp e marca oficial (Elianai); aguarda aceite |
| 4 | Homepage responsiva | Feito |
| 5 | Navegação principal | Feito: barra superior (desktop), abas fixas (celular), menu lateral da conta |
| 6 | Inglês e português do Brasil | Feito: todas as telas, troca de idioma, hreflang, teste de paridade de chaves |
| 7 | Integração inicial com Supabase | Feito: migrations, RLS, grants por coluna, trigger de perfil, testes |
| 8 | Autenticação funcional | Feito: cadastro, login, saída, confirmação de e-mail por token_hash, páginas protegidas |
| 9 | Dashboard inicial | Feito: próximas ações, objetivos com checklist, foco, personagens (estado honesto), fontes de dados, números |
| 10 | Preparação da PWA | Feito: manifest, ícones (inclui maskable e Apple), service worker restrito, página offline, instalação |
| 11 | Testes e documentação | Feito: 44 unitários, 27 pgTAP, 40 E2E (desktop + celular + acessibilidade), CI, docs |
| 12 | Preview na Vercel | **Bloqueado**: conta Vercel nova ainda não conectada (ver pendências) |

## Testes executados (23/10/2026)

- Unitários (Vitest): **44/44** (domínio 26, app 18).
- Banco (pgTAP): **27/27**, incluindo tentativa de gravar em nome de outra conta, pendurar etapa no objetivo alheio sabendo o id, e visitante anônimo.
- E2E (Playwright, build de produção, desktop 1366 px e Pixel 7): **40/40**, duas rodadas seguidas sem falhas intermitentes.
- Acessibilidade (axe, WCAG 2.1 A/AA): **zero violações** em home (en/pt), catálogo, login, cadastro, offline, 404, painel e configurações.
- Lint, tipos e formatação: limpos.

## Problemas encontrados e corrigidos

1. **Formulário de login/cadastro trocado durante o carregamento:** o formulário inteiro dependia do parâmetro da URL e era substituído quando o trecho chegava; quem digitasse rápido perdia a senha. Agora só os campos ocultos dependem da URL, e o envio completa esses campos a partir do endereço.
2. **Marcar etapa e recarregar logo em seguida perdia a marcação:** a tela mostra "Salvando…" até o servidor confirmar.
3. **Relógio usado na pré-busca de páginas privadas:** a validação de sessão passou a rodar só na requisição (`connection()`).
4. **Campo de objetivo espremido e botão sobre outro painel:** larguras corrigidas e formulário que se adapta ao espaço do painel.
5. **Proxy não rodava em quase nenhuma rota** (expressão do matcher sem a barra invertida): corrigido e coberto por E2E.

## Pendências

| Pendência | Depende de | Observação |
| --- | --- | --- |
| Publicar o repositório na conta GitHub **wowhelpbr** | Bruno: `gh auth login` com a conta wowhelpbr | Repositório público pedido pelo Bruno; histórico local pronto |
| Projeto Supabase de staging/produção | Bruno: criar projetos na conta Supabase nova e passar as chaves pelo script de MCPs/variáveis | Aplicar as migrations com `supabase db push` só depois da revisão; ligar confirmação de e-mail e SMTP próprio |
| Preview na Vercel | Bruno: conectar a conta Vercel nova ao repositório | Raiz do projeto: `apps/web`; variáveis `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `NEXT_PUBLIC_SITE_URL`. Produção só com autorização |
| Telemetria com consentimento | Decisão de ferramenta | Hoje nada é coletado (nenhum analytics), o que já respeita o consentimento |
| Recuperação de senha, exportação e exclusão de conta | Fase 6 (privacidade) | A tela de configurações já informa isso |
| Aceite do layout | Bruno | Capturas em `docs/screenshots/` |

## Próximo gate

Fase 2 (Battle.net) começa quando houver: cliente registrado no portal da Blizzard, decisão sobre o nome e o projeto Supabase de staging.
