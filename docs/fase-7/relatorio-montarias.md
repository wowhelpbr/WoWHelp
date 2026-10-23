# Montarias ricas: relatório

Data: 23/10/2026. Pedido do Bruno: card com imagem, janela com tudo sobre a montaria (como pega, onde, chance de drop, tentativas), curado por ele.

## O que está no ar

| Parte | Situação |
| --- | --- |
| Imagem oficial de cada montaria | Feito: 1682 de 1686 com imagem (cópia própria no Storage, fundo recortado). Renovada a cada 7 dias, some aos 30 (termos da API) |
| Card com profundidade | Feito: inclina com o mouse, brilho segue o cursor; parado no celular e com movimento reduzido |
| Janela de detalhes | Feito: abre por cima do catálogo com link próprio; link direto abre a página inteira |
| Chance de drop, onde e como | Feito pela curadoria: aparece só o que o Bruno publicar; chance só com fonte |
| Suas tentativas | Feito: mortes do chefe por personagem, pela Battle.net (busca em segundo plano depois de conectar). Precisa da curadoria informar o chefe |
| Modelo 3D | Não feito: só com parecer jurídico (ver `docs/monetizacao.md` e quadro de tarefas) |

## Como curar uma montaria (Bruno)

1. Entre no site com a sua conta e abra **Configurações**. No fim da página, clique em **"Abrir a curadoria"** (só aparece para curador).
2. Clique em **Montarias**, busque pelo nome e clique na montaria.
3. Preencha o que souber:
   - **Chance (%)**: ex. `1` ou `0,5`. Só salva com o **link da fonte** (de preferência fonte oficial da Blizzard).
   - **Observação**: ex. "por chefe, uma vez por semana por personagem".
   - **Onde** e **Passo a passo**, em português e inglês (o inglês pode ficar vazio; o site mostra o português no lugar).
   - **Chefe no Diário de Aventura (ID)** e **Dificuldade**: só para montaria que cai de chefe. É o que liga as "suas tentativas".
4. **Publicar** coloca no site na hora. **Salvar rascunho** guarda sem mostrar. **Despublicar** tira do site.

O número do chefe (ID) aparece na URL do Diário de Aventura em sites de banco de dados e na própria API da Blizzard (`/data/wow/journal-encounter/{id}`).

## Observações

- As tentativas contam **mortes do chefe**, não saques. A janela avisa isso.
- Personagem com perfil privado na Battle.net não entra na conta.
- 4 montarias ainda sem imagem (tentam de novo na próxima rodada); 1 a Blizzard não tem imagem.
