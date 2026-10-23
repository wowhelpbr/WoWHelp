# 06 | Companion addon e sincronização

## Proposta

O addon não é uma ferramenta de combate. É uma ponte de coleta de dados de coleção e progressão dentro das possibilidades do cliente WoW Retail, para que o site apresente um painel mais contextual.

## Funcionamento seguro

```text
WoW client -> Lua addon -> SavedVariables
                               |
                       logout ou /reload
                               |
                       arquivo .lua local
                               |
                       usuário faz upload
                               |
                    parser sem execução de Lua
                               |
                      preview e consentimento
                               |
                  snapshot persistido por usuário
```

O addon não faz HTTP nem transmite dados diretamente à Vercel ou ao Supabase. Os dados que entram no banco só são considerados confiáveis para aquele usuário, e jamais para alterar dados globais do catálogo.

## Escopo inicial possível

* Mostrar estado e versão do addon em `/wowhelp`.
* Capturar identificador local de personagem, versão do client, região quando disponível e timestamps locais.
* Capturar somente valores permitidos e não secretos referentes a coleções ou checklists selecionados, após teste em Retail atual.
* Registrar `schema_version`, `addon_version`, `data_quality` e flags de disponibilidade.
* Persistir SavedVariables via `.toc`.

O conjunto exato de APIs Lua precisa ser avaliado e testado no patch atual. Não codificar funções de coleta não verificadas. Não incluir evento de combate nem lógica para ler Secret Values.

## Importação MVP

1. Exibir instrução para sair do personagem ou executar `/reload`.
2. Solicitar arquivo específico do addon na pasta `WTF/Account/.../SavedVariables/`.
3. Limitar tamanho de upload, número de registros e profundidade máxima de estrutura.
4. Fazer parsing restrito ao formato de SavedVariables suportado, **nunca executar Lua**.
5. Exibir prévia, campo de origem e opções de inclusão por categoria.
6. Confirmar e persistir apenas campos allowlisted com RLS e auditoria.
7. Permitir apagar snapshots e desconectar a fonte.

## Fase futura | desktop sync opcional

Aplicativo separado que observa arquivo apenas com autorização do usuário, importa depois da escrita pelo jogo, nunca toca a memória/processo do WoW, nunca modifica SavedVariables em execução e faz upload HTTPS com token próprio escopado e revogável. Exige avaliação de segurança, documentação e compatibilidade Blizzard. Não é parte do MVP.

## Compatibilidade Midnight

A Blizzard passou a restringir o processamento de valores secretos relacionados a combate. Antes de implementar cada coleta, verificar a API atual e testar em client Retail. O addon deve degradar graciosamente, marcando campo indisponível, sem workaround para restrições.

## Critério de aceite

Instalação sem erros, sem travar o jogo, dados persistidos depois de reload/logout, importação manual de duas personagens, deduplicação de snapshots, mensagem clara para dados não coletáveis, e nenhuma transmissão automática feita pelo Lua addon.
