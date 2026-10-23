# Backup e rollback

## O que se recupera sozinho

| Parte | Onde está a cópia |
| --- | --- |
| Código do site e do addon | GitHub (wowhelpbr/WoWHelp), cada versão é um commit |
| Estrutura do banco (tabelas, regras de acesso) | `supabase/migrations/` no GitHub: recria um banco vazio igual ao de produção |
| Catálogo de montarias | Vem da Blizzard: rode de novo GitHub > Actions > "Catálogo oficial" > "Run workflow" |
| Dados da Battle.net | O jogador conecta de novo |

## O que NÃO se recupera sozinho

Contas, objetivos, planejador, marcações manuais e importações do addon dos jogadores.

O plano gratuito do Supabase **não tem cópia de segurança automática que dê para restaurar**. Antes do beta com jogadores de verdade, escolha uma das opções:

1. **Supabase Pro** (pago): cópia diária guardada por 7 dias, restaurada pelo painel. Recomendado para o beta.
2. **Cópia manual** (grátis, dá trabalho): uma vez por semana, no terminal, na pasta do projeto:
   1. `npx supabase db dump --linked --data-only -f backup-AAAA-MM-DD.sql`
   2. Guarde o arquivo **fora** do repositório e criptografado (ele tem e-mails de jogadores). Nunca suba no GitHub (o repositório é público).
   3. Apague cópias com mais de 30 dias.

## Voltar o site para a versão anterior

Quando uma atualização quebrou o site:

1. Vercel > projeto "wowhelp" > Deployments.
2. Ache a última versão boa (marcada "Production" antes da atual).
3. Menu "..." > **"Instant Rollback"** (ou "Promote to Production").
4. Depois corrija o problema num pull request; o próximo merge no `main` publica de novo.

## Voltar uma mudança no banco

As migrations só andam para frente. Para desfazer uma:

1. Escreva uma migration nova que desfaz (ex.: apaga a coluna criada), teste no banco local (`npx supabase db reset` e `npx supabase test db`).
2. Aplique com `npx supabase db push --linked`.

Mudança que apaga dados (apagar tabela ou coluna com conteúdo) só depois de uma cópia manual (opção 2 acima).

## Teste de restauração

Antes do beta: restaurar uma cópia num projeto Supabase de teste e conferir se o login e os objetivos aparecem. Cópia que nunca foi restaurada não conta como cópia.
