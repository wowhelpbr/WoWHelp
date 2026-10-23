# 04 | Dados, fontes e integrações

## Regra central

Cada afirmação de estado no produto deve ser rastreável a uma fonte. O modelo precisa diferenciar `collected`, `not_collected` e `unknown`; ausência de registro não prova ausência na conta.

## Fontes por prioridade

| Fonte | Dados planejados | Status e cuidados |
| --- | --- | --- |
| Battle.net oficial | Personagens, coleções e catálogo disponível | Primeira escolha, OAuth e escopos; validação necessária |
| Conteúdo editorial WoWHelp | Requisitos de montarias e atividades revisadas | Conteúdo próprio, auditoria factual e autoria |
| Addon WoWHelp Companion | Dados que Lua pode observar legalmente e salvar | Apenas API permitida, sem rede dentro do jogo |
| Input manual do jogador | Objetivos, conclusão e duração | Sempre marcado como informado pelo usuário |
| Terceiros | Links de consulta e metadados licenciados | Somente com termos, licença e permissões válidas |

## Battle.net

* Registrar aplicação em https://develop.battle.net/ e verificar documentação atual de auth e WoW APIs.
* Validar endpoint de perfil de usuário e escopo `wow.profile` em conta de teste antes de construir telas que dependam disso.
* Não supor disponibilidade uniforme por região, versão do jogo, conta ou personagem.
* Guardar `provider_account_id`, região e scopes aprovados em registros privados; tokens exclusivamente no servidor com cifra e rotação.
* Revogação remove ou invalida credenciais e deixa claro quais dados de histórico permanecem até exclusão solicitada.

## ID e domínio

`characters`: chave interna UUID, `region` e `realm` distintos, identificador oficial do personagem quando disponível e proprietário WoWHelp. Nome pode mudar; jamais usá-lo sozinho como identificador permanente.

`collectibles`: tipo `mount` inicialmente, ID oficial, metadata de expansão e classificações; textos em traduções independentes.

`collection_state`: origem, momento, confiança e enum tri state.

`activities`: duração esperada, janela de disponibilidade, região, relevância, fonte e versionamento de regras.

`goals`: referências ao usuário e objeto, estado manual, prioridade e checklist.

`source_references`: endereço de origem, autoria/editor, revisão e direitos.

## Validação de conteúdo

Para cada montaria: ID, nome oficial, source URL, versão do jogo, expansão, modo de obtenção, disponibilidade atual, requisitos, local, passos, variantes região/facção, tempo estimado, autoria, última verificação e licença de imagem.

Estados editoriais: `draft`, `needs_review`, `approved`, `retired`. Nunca misturar orientação de 2020 com dicas para 2026 sem rótulo de expansão e revalidação.

## Plano B

Se o OAuth/endpoint da Blizzard não estiver liberado, permitir criação de objetivos independentes sem apresentar falsa sincronização. Se addon não puder observar dado, omitir o campo do payload e mostrar unknown. Se API de terceiros proibir uso concorrente, usar link externo ou construir funcionalidade própria com dados permitidos.

## Resets e fuso

Não codificar um único horário mundial. Introduzir calendário de resets mantido por região, fonte oficial e timezone IANA; após verificação, calcular atividades pelo horário da região do personagem e comunicar ao usuário no horário local escolhido.

## Contrato de sincronização

Snapshots com `schema_version`, `source_type`, `source_timestamp`, `region`, `character_ref`, `payload`, `available_fields`; armazenar evento de importação e resultados de validação. Auditoria de quem e quando importou.

API planejada (descritiva, não implementada): `GET /api/me/characters`, `POST /api/connections/battlenet/start`, `GET /api/connections/battlenet/callback`, `POST /api/sync/characters`, `GET /api/catalog/mounts`, `POST /api/goals`, `PATCH /api/goals/:id`, `POST /api/addon/imports/validate`, `POST /api/addon/imports/confirm`.

É obrigatório validar CSRF e integridade da sessão para rotas de mudança de estado; não confiar em user_id enviado pelo cliente.
