# Registro de decisões técnicas

Complementa `planning/docs/10_DECISOES_E_RISCOS.md` (D01–D06 e R01–R09). Cada item: decisão, motivo e o que muda se for revista.

| ID | Data | Decisão | Motivo | Revisitar quando |
| --- | --- | --- | --- | --- |
| T01 | 23/10/2026 | Monorepo com npm workspaces: `apps/web` e `packages/shared` | Segue a organização proposta no plano; o domínio (enums, schemas) fica fora do app e pode ser usado por um sincronizador desktop no futuro | Se surgir um segundo app (desktop sync) ou pnpm for adotado |
| T02 | 23/10/2026 | Next.js 16.4 com Cache Components e Partial Prefetching ligados | Padrão do template atual; vira obrigatório na próxima versão maior. Páginas públicas saem com shell estático e partes privadas em streaming | Nunca desligar sem medir; ver T05 |
| T03 | 23/10/2026 | next-intl 4 com `next/root-params`, locales `en-US`/`pt-BR` e URLs `/en` e `/pt-br` | Locale igual ao do banco; prefixo curto e legível na URL; hreflang automático | Se quisermos URLs traduzidas (`/pt-br/montarias`), usar `pathnames` do next-intl |
| T04 | 23/10/2026 | Supabase Auth com e-mail e senha; sessão por cookies via `@supabase/ssr`; `getClaims()` no servidor | Recomendação atual da Supabase; nunca confiar em `getSession()` no servidor | Fase 2 pode adicionar login social; Battle.net continua como vínculo separado (D06) |
| T05 | 23/10/2026 | Leitura da sessão sempre depois de `connection()` | A validação do token consulta o relógio; sem isso o Next acusa erro na pré-busca de navegação | Se a Supabase oferecer validação sem relógio no SDK |
| T06 | 23/10/2026 | Proxy único: renova a sessão do Supabase primeiro e depois roteia o idioma | O next-intl repassa os cabeçalhos da requisição; o cookie renovado chega às páginas sem segunda renovação (evita invalidar o refresh token) | Se o next-intl mudar a forma de montar a resposta |
| T07 | 23/10/2026 | Mutações por Server Actions, sempre revalidando a sessão; RLS no banco como segunda barreira | Server Actions têm proteção CSRF por origem; nenhum `user_id` vem do cliente | — |
| T08 | 23/10/2026 | Migrations só com as tabelas da Fase 1 (perfis, objetivos, etapas, catálogo) | Personagens, coleções e importação do addon dependem do formato real da API Battle.net, ainda não testado | Início das Fases 2 e 5 |
| T09 | 23/10/2026 | Grants por coluna e limites por conta (200 objetivos, 50 passos por objetivo) | O cliente não escolhe `id` nem `user_id`; evita crescimento descontrolado | Se os limites atrapalharem uso real |
| T10 | 23/10/2026 | CSP sem nonce (`script-src 'self' 'unsafe-inline'`) | Nonce obriga renderização dinâmica de todas as páginas, perdendo o shell estático | Avaliar SRI experimental do Next antes do beta público |
| T11 | 23/10/2026 | Service worker só guarda arquivos estáticos e páginas offline baixadas sem cookies | Nada da conta fica em cache no aparelho (doc 05) | Se houver modo offline para conteúdo público, como o catálogo |
| T12 | 23/10/2026 | Supabase local em portas 554xx e app na porta 3100 | Outro projeto da máquina ocupa 543xx e 3000 | — |
| T13 | 23/10/2026 | Sistema visual HUD (Chakra Petch, cantos retos) com cores do WoWHelp na linha do Heroes of the Storm | Pedido do Bruno; ver docs/design/identidade-visual.md | Revisão de marca antes do beta |
| T14 | 23/10/2026 | Artes originais fora do git; só versões otimizadas (WebP) entram no repositório | Repositório público, 129 MB de originais e contrato com dados pessoais | — |
| T15 | 23/10/2026 | Catálogo de montarias lido a cada requisição (sem `use cache`) | Ainda vazio e o banco pode não existir no build | Fase 3, junto com o conteúdo revisado |
| T16 | 23/10/2026 | Token da Battle.net não é guardado: sincroniza logo após a autorização e descarta | Sem refresh token documentado; elimina risco de vazamento | Se a Blizzard documentar refresh token e houver necessidade de sync em segundo plano |
| T17 | 23/10/2026 | Dados vindos da Blizzard só são gravados pelo servidor (chave secreta), depois de validar a sessão | O navegador não pode "fingir" dado oficial; marcação manual tem fonte própria (`manual`) | — |
| T18 | 23/10/2026 | Limpeza de 30 dias pelo `pg_cron` no próprio banco | Termos da API exigem TTL máximo de 30 dias | Se o volume exigir limpeza em lote |
| T19 | 23/10/2026 | E2E usa uma Battle.net falsa local (`tests/mocks/blizzard-mock.mjs`); o desvio só aceita endereço local | Testar o fluxo inteiro sem conta real nem segredo | — |
| T20 | 23/10/2026 | Produção: Supabase "wowhelp site" configurado por `[remotes.production]` no config.toml; confirmação de e-mail desligada até SMTP próprio | Plano gratuito só entrega e-mail para a equipe e recusa modelo customizado | Ao configurar SMTP (Resend ou similar) |
