# Gamificação do WoWHelp

Aprovada pelo Bruno em 24/10/2026. Animações com [motion.dev](https://motion.dev) (`motion/react`, carregado leve com `LazyMotion`).

## Diversões que a gamificação serve (MDA)

| Tipo | Por quê | Como aparece |
| --- | --- | --- |
| **Desafio** | Colecionador e jogador de semanais gostam de meta para bater | Conquistas com alvo (100 montarias, 12 semanas seguidas), barra até o próximo nível |
| **Submissão** | O loop gostoso de marcar e ver subir toda semana | +XP a cada passo, semanal ou marcação; barra com mola; sequência de semanas |
| **Expressão** | Mostrar a jornada | Nível e título (Recruta → Mito) no cabeçalho e no painel, selos de conquista |

Ficam de fora de propósito: **Narrativa** e **Fantasia** (o próprio jogo entrega), **Companheirismo** (fica para depois, com a Comunidade BR), **Descoberta** (já é o catálogo).

## Regras

- **XP só pelo que se faz no site:** passo concluído +10, objetivo concluído +50, semanal feita +15, diária feita +5, marcar "já tenho" +3.
- **Coleção da Battle.net não dá XP**, mas conta para as conquistas de coleção. A primeira sincronização não pode jogar ninguém no nível 30 de uma vez.
- Nada é guardado à parte: XP, nível e conquistas são calculados a partir do que já existe (`public.my_progress()`). Desfazer um passo tira o XP de volta.
- **Curva:** cada nível pede 100 XP + 50 por nível já subido (nível 2 = 100, 3 = 250, 4 = 450…). Máximo 80.
- **Títulos:** Recruta (1), Viajante (5), Estrategista (10), Combatente (20), Ícone (35), Lenda (50), Mito (70). Todos neutros em gênero.
- **Sequência:** semanas seguidas com pelo menos uma semanal feita. Continua valendo se a última foi nesta semana ou na anterior.
- **Conquistas (13):** primeiro passo, 50 passos, primeiro objetivo, 10 objetivos, 4 e 12 semanas seguidas, 100 e 300 montarias, 100 mascotes, 100 brinquedos, Battle.net conectada, addon importado, apoiador.
- **Comemoração:** o navegador guarda o último estado visto (nível, XP, conquistas). Ao voltar, comemora só o que subiu: "+XP", "Subiu para o nível N", "Objetivo concluído!" e "Conquista desbloqueada", com confete. Na primeira visita só anota.
- Nada disso usa dado da Blizzard como recurso pago nem compara jogadores (sem ranking).

## Movimento

- Cartões do catálogo, dos passos da home, da Comunidade e das conquistas entram em cascata (só deslocamento, nunca escondidos).
- Barras de XP e de objetivo com mola; marca de passo feito com "pop"; XP total sobe contando.
- Quem liga "reduzir movimento" no aparelho vê tudo parado (`MotionConfig reducedMotion="user"`).

## Onde está no código

- Regras puras: `apps/web/src/features/gamification/rules.ts` (testes em `tests/unit/gamification.test.ts`).
- Leitura do progresso: `features/gamification/queries.ts` e a função `my_progress()` em `supabase/migrations/20261028000100_gamification.sql`.
- Movimento: `features/gamification/motion.tsx`; comemoração: `celebrations.tsx`; nível no cabeçalho: `xp-badge.tsx`; painel "Sua jornada": `journey-panel.tsx`.
- Teste de ponta a ponta: `tests/e2e/gamification.spec.ts`.

## Ideias para depois

- Conquistas raras curadas pelo Bruno (por exemplo, montarias com chance de drop abaixo de 1%).
- Mostrar nível e selos no perfil público da Comunidade BR (Companheirismo), se o Bruno quiser.
