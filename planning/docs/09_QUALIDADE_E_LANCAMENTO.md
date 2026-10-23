# 09 | Qualidade, segurança, beta e lançamento

## Plano de testes

**Unitários:** duração do plano, ordenação de tarefas, tri state de coleção, normalização de character ID, parsing allowlisted de snapshot, comparação de timestamps e deduplicação.

**Integração:** OAuth Battle.net bem sucedido e revogado, region scope, 401/403/429/500, race conditions de sync, idempotência de importação, policy RLS e separação staging/produção.

**E2E:** sem login pesquisa montaria; com login cria objetivo; troca personagem; seleciona 30 min; marca etapa; mobile salva estado; addon importa dado; usuário apaga seus dados.

**Addon:** Retail patch atual, erro na ausência de API, mudanças de interface, `/reload`, logout, reset de versão de SavedVariables, two characters, dados nulos e não execução de comunicação externa.

**Mobile:** Chromium Android, Safari iOS, desktop Chromium e Firefox; teste PWA com e sem instalação, reabertura offline de conteúdo público e revalidação online de dados privados.

**Segurança:** RLS com usuários A e B, CSRF, input inválido, upload oversized, zip bomb e Lua maliciosa, XSS em nomes/dados importados, rate limiting, logs sem tokens, revoke tokens, exclusão completa.

## Observabilidade

* Telemetria apenas de eventos necessários: objective_created, plan_generated, task_completed, battlenet_link_succeeded, battlenet_link_failed, addon_import_succeeded, addon_import_failed.
* Nunca registrar token, nome real, arquivos integrais de addon ou IDs sensíveis em analytics de terceiros.
* Logs de erro estruturados com request_id, categoria e status, sem payload secreto.
* Alertas para erros OAuth, picos 429, falhas de job e gasto de infraestrutura.

## Privacidade e LGPD

Política clara de dados coletados, finalidade, fundamento jurídico, retenção, mecanismos de exportação e eliminação, consentimento de vinculação, localização de processamento de dados e contato responsável. Solicitar revisão profissional dos documentos antes do lançamento. O usuário deve poder desvincular Battle.net sem apagar imediatamente todo o conteúdo manual, e solicitar exclusão total de dados conforme requisitos aplicáveis.

## Beta gradual

1. Alpha interno com 3 a 5 contas de teste.
2. Beta fechado de 20 a 50 jogadores de perfis diferentes, com feedback estruturado.
3. Revisão de funil e correção de bugs antes de abrir ao público.

Tamanhos de grupos são propostas de operação e dependem de consentimento, disponibilidade e capacidade técnica.

## Checklist de go live

[ ] Fonte oficial e limites de Battle.net confirmados
[ ] Migrations revistas e RLS auditada
[ ] Mobile e PWA testados
[ ] Addon testado no patch Retail vigente
[ ] Retenção e exclusão de dados implementadas
[ ] Assets com direitos verificados
[ ] Conteúdo editorial de 30 montarias revisado
[ ] Páginas legais e aviso de não afiliação definidos
[ ] Monitoramento e alertas funcionando
[ ] Backup e rollback documentados
[ ] Domínio apontado somente após validação de produção

## Métrica norte

Percentual de sessões em que o usuário consegue escolher e executar uma próxima atividade útil sem consultar outra ferramenta. Medir por pesquisa e proxy observável; não alegar conhecimento de ações dentro do jogo sem dado confiável.
