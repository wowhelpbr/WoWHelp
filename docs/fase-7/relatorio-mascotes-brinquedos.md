# Mascotes e brinquedos: relatório

Data: 23/10/2026. Mesmo modelo das montarias, a pedido do Bruno ("e assim para todos os itens").

## O que está no ar

| Parte | Situação |
| --- | --- |
| Catálogo oficial de mascotes | 2182 espécies (Game Data API), com tipo (Fera, Mecânico...), origem, facção e descrição em português |
| Catálogo oficial de brinquedos | 1146 brinquedos, com origem; o nome vem do item |
| Imagens | Mascote: modelo renderizado com fundo recortado (como as montarias). Brinquedo: ícone oficial do item (a Blizzard só tem o ícone pequeno) |
| Páginas | `/pets` e `/toys` com abas Montarias / Mascotes / Brinquedos; o menu do site virou **Coleções** |
| Filtros | Busca, origem, tipo (mascotes), facção e "minha coleção" |
| Janela de detalhes | Igual à das montarias, com link próprio |
| Sua coleção | A conexão Battle.net traz mascotes e brinquedos da conta; "não obtido" só com leitura completa recente |
| Curadoria | `/admin/pets` e `/admin/toys` (chance de drop com fonte, local, passo a passo, chefe) |
| Objetivo | "Transformar em objetivo" funciona para mascote e brinquedo |

## Conferido com dados reais

Os formatos da API vieram dos modelos públicos de um wrapper (a Blizzard não publica exemplos). A importação na produção confirmou: ex. mascote 39 "Esquilo Mecânico" (Mecânico, Profissão) e brinquedo 1 "Orbe do Logro" (Saque).

## Pendências

- Formato das coleções de mascotes e brinquedos **da conta**: não documentado; o leitor é defensivo (formato estranho vira "desconhecido"). Confirmar no teste real da Battle.net do Bruno.
- Descrição dos brinquedos (o efeito de "Usar") não vem no endpoint do brinquedo; precisa de uma chamada a mais por item. Fica para depois.
- O addon Companion ainda importa só montarias.
