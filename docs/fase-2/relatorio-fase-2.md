# Fase 2 | Battle.net e personagem: relatório

Data: 23/10/2026 (noite). Gate (planning/docs/02): autorização funcional com conta de teste, revogação funcional, erros claros, nenhuma credencial no browser ou logs, zero dados de usuário cruzados.

## Situação do gate

| Critério | Situação | Evidência |
| --- | --- | --- |
| Autorização funcional | **Implementada e testada contra uma Battle.net falsa**; teste com conta real depende do Bruno | E2E `battlenet.spec.ts` (desktop e celular) |
| Revogação (desconectar) | Feita: apaga conexão, personagens e coleção vindos da Battle.net | E2E + pgTAP |
| Erros claros | 11 resultados com mensagem própria (recusou, expirou, state inválido, sessão trocada, token, perfil, armazenamento...) | `messages/*.json` → `Characters.results` |
| Nenhuma credencial no navegador | Segredo do cliente só no servidor; token da Battle.net **não é guardado** (usado na hora e descartado) | `lib/blizzard/client.ts`, `features/battlenet/sync.ts` |
| Zero dados cruzados | RLS: navegador só lê e apaga os próprios dados; gravação só pelo servidor depois de validar a sessão | pgTAP `02_battlenet_rls` (14 testes) |

## Como funciona

1. Em **Personagens**, o jogador escolhe a região e clica em "Conectar Battle.net".
2. O servidor gera um `state` aleatório, guarda num cookie httpOnly de 10 min junto com o id do usuário, e manda para `oauth.battle.net/authorize` com `openid wow.profile`.
3. Na volta (`/api/connections/battlenet/callback`), o servidor confere o `state` e se a sessão é do mesmo usuário, troca o código pelo token, lê `/userinfo`, `/profile/user/wow` e `/profile/user/wow/collections/mounts`, grava e **descarta o token**.
4. "Sincronizar de novo" repete a autorização (sem refresh token documentado, é o caminho seguro).
5. Tudo que veio da Blizzard tem `fetched_at` e é apagado pelo `pg_cron` todo dia às 04:17 UTC se passar de 30 dias (Termos da API).

## Decisões

- **Sem guardar token:** elimina o risco de vazamento de credencial da Blizzard e respeita a ausência de refresh token documentado.
- **Coleção desconhecida ≠ faltando:** se a leitura das montarias falhar ou vier em formato inesperado, a coleção fica "desconhecida", nunca vazia.
- **Endereço de retorno** registrado na Blizzard: `https://wowhelp.vercel.app/api/connections/battlenet/callback`. Previews da Vercel não conseguem concluir a conexão (endereço muda a cada deploy).

## Pendências

- [!] Teste com a conta Battle.net real do Bruno: confirmar formato de `/userinfo`, `/profile/user/wow` e da coleção da conta (TBD da Fase 0).
- Formato das respostas foi implementado a partir de exemplos públicos da comunidade e lido de forma defensiva; ajustar se o teste real mostrar diferença.
