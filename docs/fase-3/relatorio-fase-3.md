# Fase 3 | Montarias e objetivos: relatório

Data: 23/10/2026 (noite). Gate (planning/docs/02): 30 entradas validadas; pesquisa, filtro e criação de objetivo funcionam no celular; estados desconhecidos não viram "não obtidos".

## Situação do gate

| Critério | Situação | Evidência |
| --- | --- | --- |
| Entradas validadas | **Catálogo inteiro vem da API oficial da Blizzard** (todas as montarias do Retail), com crédito; nada digitado à mão | `features/catalog/sync.ts`, workflow "Catálogo oficial" |
| Pesquisa, filtro e objetivo no celular | Feito: busca sem acento, origem, facção, status da coleção, paginação; detalhe vira objetivo | E2E `catalog.spec.ts` (desktop e celular) |
| Desconhecido ≠ não obtido | Regra no domínio: ausência só vira "não obtida" com sincronização completa da Battle.net nos últimos 30 dias | `mountStatusFor` + 6 testes; E2E confere "Unknown" antes de conectar |

## Como funciona

- **Importação:** o GitHub Actions ("Catálogo oficial", todo dia às 08:35 UTC ou sob demanda) chama `POST /api/cron/catalog-sync` com o `CRON_SECRET`. Cada chamada importa um lote de até 120 montarias (índice + detalhe, sem `locale` para pegar inglês e português numa resposta só). Cada montaria é renovada a cada 7 dias; o que não for renovado em 30 dias é apagado pela limpeza diária.
- **Catálogo:** público, em cache de 1 hora, invalidado a cada lote importado. Montarias que o jogo esconde até você ter (`should_exclude_if_uncollected`) só aparecem para quem já tem.
- **Status por jogador:** coletada (verde), não obtida (neutro) e desconhecido (tracejado), com a fonte ("Pela Battle.net", "Marcado por você").
- **Marcação manual:** "Já tenho" / "Ainda não tenho" para quem não conectou a Battle.net; sempre identificada como informada pelo jogador.

## Decisões

- O "lote editorial de 30 montarias revisadas à mão" do plano virou **catálogo oficial completo**: os dados vêm da própria Blizzard, então não há risco de informação inventada ou desatualizada. Passo a passo editorial ("onde fica, como chegar") continua como trabalho futuro com revisão humana.
- Sem imagens por enquanto: a Blizzard recomenda copiar as imagens para servidor próprio; isso entra junto com o armazenamento (Supabase Storage).

## Pendências

- Passo a passo editorial revisado para as montarias mais buscadas.
- Imagens das montarias copiadas para o Storage com crédito.
- Confirmar no primeiro lote real que o formato de `/data/wow/mount/{id}` bate com o esperado (TBD A6 da Fase 0).
