# Fase 5 | Addon WoWHelp Companion: relatório

Data: 24/10/2026 (madrugada). Gate (planning/docs/02): addon leve, sem automações proibidas, sem captura de dados de combate secretos, sem envio HTTP; a importação rejeita conteúdo malicioso ou malformado sem executar Lua.

## Situação do gate

| Critério | Situação | Evidência |
| --- | --- | --- |
| Addon leve | 5 arquivos Lua, ~12 KB. Lê só no login, ao ganhar montaria e (se estava em combate) ao sair do combate | `addon/WoWHelpCompanion/` |
| Sem automações proibidas | Só leitura de APIs do cliente; nenhum clique, movimento ou ação automática | Teste `addon-lua-syntax.test.ts` recusa padrões proibidos |
| Sem dados de combate secretos | Não lê combate, chat, amigos nem guilda; adia a leitura se o jogador estiver em combate | `Core.lua` (PLAYER_REGEN_ENABLED) |
| Sem envio HTTP | Addons não conseguem acessar a internet; o jogador envia o arquivo no site | — |
| Importação sem executar Lua | Leitor próprio que só aceita tabelas, textos, números e verdadeiro/falso; recusa chamadas de função, variáveis, concatenação, profundidade/tamanho/itens acima do limite e chaves `__proto__` | 19 testes em `snapshot.test.ts` |
| Validação estrita e confirmação | Prévia sem gravar nada; o servidor lê o arquivo de novo na confirmação; o jogador escolhe o que importa (personagens, montarias) | E2E `addon-import.spec.ts` |
| Marcação de snapshots locais | Cada importação guarda versão do addon, horário da leitura no jogo e contagens; o mesmo arquivo não entra duas vezes (hash) | Tabela `addon_imports`, pgTAP `04_addon_imports_rls.test.sql` |
| Teste com 2 personagens e reload/logout | **Pendente: depende do Bruno no jogo** (roteiro abaixo) | — |

## O que o jogador vê

- Página **Importar addon** (menu da conta): 4 passos com o botão de baixar o addon, área para enviar ou arrastar o arquivo, prévia (personagens, montarias, região, horário da leitura), escolha do que importar, histórico e "Apagar dados do addon" com confirmação.
- Personagens importados aparecem em **Personagens** com o selo "Addon Companion".
- A coleção do addon conta como lista completa por 30 dias: montaria fora dela vira **não obtida**; depois disso volta a **desconhecido**.
- Painel: "Fontes de dados" mostra quando foi a última importação.

## Bug encontrado e corrigido nos testes

O leitor recusava o arquivo inteiro quando faltava um horário opcional (o addon deixa vazio quando o jogo não informa o reset semanal). Corrigido e coberto por teste.

## Roteiro de teste no jogo (para o Bruno)

1. No site, entre na conta e abra **Importar addon**. Clique em **Baixar o addon 0.1.0**.
2. Extraia o zip em `World of Warcraft\_retail_\Interface\AddOns` (deve ficar a pasta `WoWHelpCompanion` lá dentro).
3. Abra o jogo. Na tela de personagens, em **AddOns**, confira se "WoWHelp Companion" aparece ligado e sem aviso de "desatualizado".
4. Entre com um personagem e digite `/wowhelp`. Deve aparecer a versão e "última leitura".
5. Digite `/reload`. Saia e entre com **outro personagem**. Digite `/wowhelp` de novo.
6. Saia do jogo.
7. No site, envie o arquivo `World of Warcraft\_retail_\WTF\Account\<SUA CONTA>\SavedVariables\WoWHelpCompanion.lua`.
8. Confira na prévia: os 2 personagens e o número de montarias. Clique em **Importar**.
9. Abra **Personagens** e **Montarias** e veja se bate com o jogo.

Se algo der erro no jogo (janela vermelha de Lua), tire um print da mensagem: ela diz o arquivo e a linha.

## Pendências

- [!] Teste real no jogo (roteiro acima).
- Confirmar o horário do reset das Américas com o campo `weeklyResetAt` que o addon já grava (o site ainda não usa esse dado).
- Publicar o addon no CurseForge/Wago só depois do teste e da decisão sobre o nome (marca "WoW").
