# Domínio wowhelp.com.br

O domínio é do Bruno, registrado pela Hostinger (válido até 21/10/2027). Em 24/10/2026 ele já foi adicionado ao projeto **wowhelp** na Vercel (com e sem `www`); falta só apontar o DNS.

## Passo a passo na Hostinger (Bruno)

1. Entre no painel da Hostinger (hPanel) > **Domínios** > **wowhelp.com.br** > **DNS / Nameservers** (ou "Gerenciar registros DNS").
2. **Apague** os registros do tipo **A** com nome **@** que existem hoje (apontam para a página de estacionamento da Hostinger: `77.37.76.202` e `147.79.120.61`). Se existir um **CNAME** com nome **www**, apague também.
3. Crie estes três registros (TTL pode ficar o padrão):

| Tipo | Nome | Aponta para |
| --- | --- | --- |
| A | @ | 216.198.79.1 |
| A | @ | 64.29.17.1 |
| CNAME | www | 5935ed9f0b1dcc46.vercel-dns-017.com |

4. **Não mexa** em registros MX ou TXT de e-mail, se houver.
5. Me avise. A mudança pode levar de alguns minutos a algumas horas. Eu confiro com `vercel domains verify wowhelp.com.br`, e a Vercel cria o certificado (cadeado) sozinha.

## Depois que o domínio responder (Claude)

- `NEXT_PUBLIC_SITE_URL=https://wowhelp.com.br` na Vercel e publicar de novo.
- Supabase: `site_url` e endereços de retorno do login com o domínio novo (`supabase/config.toml`, `[remotes.production]`) e `supabase config push`.
- `www` redireciona para `wowhelp.com.br`.
- Workflows (`catalogo.yml`, `comunidade.yml`, `saude.yml`) passam a usar o domínio novo.
- `wowhelp.vercel.app` continua funcionando.

## O que o Bruno faz na Battle.net

No https://develop.battle.net > cliente do WoWHelp > **Redirect URLs**, adicione (sem tirar a antiga):
`https://wowhelp.com.br/api/connections/battlenet/callback`

## Outros domínios

Em 24/10/2026, pelo registro oficial (RDAP): `wowhelp.com` tem dono; `wowhelp.net`, `wowhelp.io` e `wowhelp.app` estão livres. Recomendação: não comprar mais nenhum domínio com "wow" antes da decisão sobre o nome. Os termos da API da Blizzard proíbem marca da Blizzard no nome e no endereço do app, e as diretrizes de marca proíbem marca no domínio (ver `docs/fase-6/checklist-legal.md`).
