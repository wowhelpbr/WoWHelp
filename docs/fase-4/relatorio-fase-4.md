# Fase 4 | Planejador semanal e de sessão: relatório

Data: 23/10/2026 (noite). Gate (planning/docs/02): o plano evita tarefas bloqueadas, separa atividade semanal de permanente e explicita estimativas.

## Situação do gate

| Critério | Situação | Evidência |
| --- | --- | --- |
| Separa semanal de permanente | Tarefas recorrentes (semanais ou diárias) ficam separadas dos objetivos permanentes; a conclusão vale só até o próximo reset | `task_completions.cycle_key`, E2E `planner.spec.ts` |
| Explicita estimativas | Cada item mostra o tempo; itens **sem estimativa ficam numa lista à parte e não entram na conta** | `planSession` + 4 testes |
| Evita tarefas bloqueadas | A sessão usa só o **próximo passo aberto** de cada objetivo ativo (não pula etapas) e ignora tarefas já feitas no ciclo e objetivos pausados | `getPlannerData` |
| Sessões de 15/30/60/120+ min | Feito, com ordem estável: o que vence antes no reset primeiro, depois prioridade, depois menor duração | E2E |

## Reset por região

| Região | Reset semanal | Status | Fonte |
| --- | --- | --- | --- |
| Europa | Quarta 05:00 CET (04:00 UTC) | **Oficial** | [Anúncio da Blizzard, 01/11/2022](https://eu.forums.blizzard.com/en/wow/t/weekly-reset-time-changing-to-0500-cet-on-16-november/398498) |
| Américas | Terça 15:00 UTC | **Estimado** (só fontes de terceiros, que discordam sobre o horário de verão) | [VaultAlts](https://vaultalts.com/reset-timer), [MMOlist](https://mmo-list.com/games/world-of-warcraft/reset) |
| Coreia / Taiwan | Quarta 23:00 UTC | Estimado | [MMOlist](https://mmo-list.com/games/world-of-warcraft/reset) |

O site mostra o horário no fuso do aparelho do jogador e avisa quando é estimado. Na Fase 5, o addon pode confirmar o horário exato pelo próprio jogo.

## Decisão

As tarefas recorrentes são **do jogador**: o WoWHelp não publica uma lista editorial de atividades do patch atual sem revisão humana (regra contra conteúdo desatualizado). Sugestões revisadas por região podem entrar depois.

## Pendências

- Confirmar o reset das Américas (com o addon ou fonte oficial) e trocar "estimado" por "oficial".
- Lista editorial revisada de atividades semanais do Midnight.
