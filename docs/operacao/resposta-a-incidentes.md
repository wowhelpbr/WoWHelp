# Resposta a incidentes

Para quando algo sério acontecer: vazamento de dados, chave exposta, site fora do ar, conta invadida. Escrito para o Bruno seguir sem precisar ler código.

## 1. Classificar (5 minutos)

| Nível | Exemplos | Prazo para agir |
| --- | --- | --- |
| **Crítico** | Chave secreta publicada (GitHub, chat, print), dados de uma conta aparecendo para outra, banco acessado por quem não devia | Agora |
| **Alto** | Site fora do ar, login quebrado, conexão Battle.net falhando para todos | No mesmo dia |
| **Médio** | Catálogo de montarias desatualizado, importação do addon falhando, página com erro | Em até 3 dias |

## 2. Conter

**Chave exposta** (troque só a que vazou):

1. **Supabase, chave secreta:** painel do Supabase > projeto "wowhelp site" > Project Settings > API Keys > crie uma nova "secret key" e apague a antiga. Depois, na Vercel (projeto "wowhelp" > Settings > Environment Variables), troque `SUPABASE_SECRET_KEY` e clique em "Redeploy".
2. **Battle.net:** develop.battle.net > cliente do WoWHelp > gere um novo "Client Secret". Na Vercel, troque `BATTLENET_CLIENT_SECRET` e faça "Redeploy".
3. **CRON_SECRET** (importação do catálogo): gere um texto aleatório novo, troque na Vercel e no GitHub (repositório wowhelpbr/WoWHelp > Settings > Secrets and variables > Actions).
4. **Senha de conta (GitHub, Vercel, Supabase, Battle.net):** troque a senha e confira se a verificação em duas etapas está ligada.

**Site com defeito depois de uma atualização:** volte para a versão anterior (veja [backup-e-rollback.md](backup-e-rollback.md), "Voltar o site").

**Desligar a Battle.net às pressas:** apague `BATTLENET_CLIENT_ID` na Vercel e faça "Redeploy". O site passa a mostrar "conexão indisponível" sem quebrar o resto.

**Conta de jogador invadida:** no Supabase > Authentication > Users, procure o e-mail e use "Delete user" (apaga a conta e os dados) ou "Send password recovery".

## 3. Avisar (dados pessoais envolvidos)

Pela LGPD (art. 48), incidente com risco ou dano relevante aos jogadores precisa ser comunicado à **ANPD** e aos **jogadores afetados**. O regulamento da ANPD (Resolução CD/ANPD nº 15/2024) fala em **3 dias úteis** a partir de quando se sabe que o incidente envolveu dados pessoais. Confirmar prazos e formulário com o jurídico antes do beta.

Anote desde o começo: o que aconteceu, quando foi descoberto, quais dados e quantas contas, o que já foi feito.

## 4. Recuperar

- Confira o site em produção: cadastro, login, painel, montarias, importação do addon.
- Rode a importação do catálogo de novo se o catálogo foi afetado: GitHub > Actions > "Catálogo oficial" > "Run workflow".
- Dados apagados por engano: ver [backup-e-rollback.md](backup-e-rollback.md).

## 5. Depois (até 1 semana)

Escreva em `docs/operacao/incidentes/AAAA-MM-DD-nome.md`: o que aconteceu, causa, impacto, o que foi feito, o que muda para não repetir. Sem culpados, só causas.

## Onde olhar quando algo parece errado

| O quê | Onde |
| --- | --- |
| Erros do site | Vercel > projeto "wowhelp" > Logs (eventos em JSON, sem dados pessoais: `addon_import_failed`, `battlenet_link_failed`, etc.) |
| Importação do catálogo | GitHub > Actions > "Catálogo oficial" (o GitHub manda e-mail quando falha) |
| Testes automáticos | GitHub > Actions > "CI" |
| Banco e login | Supabase > projeto "wowhelp site" > Logs e Advisors |
