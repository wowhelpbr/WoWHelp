# Fase 6 | Beta: relatório

Data: 24/10/2026 (madrugada). Gate (planning/docs/02): fluxos críticos aprovados, incident response escrito, política de exclusão de conta testada e checklist legal concluído.

## Situação do gate

| Critério | Situação | Evidência |
| --- | --- | --- |
| Fluxos críticos aprovados | **Feito nos testes automáticos**: 70 E2E (desktop e celular) cobrem cadastro, objetivo, montaria, Battle.net (falsa), planejador, importação do addon, exportar e excluir conta. Falta o teste real (Battle.net e jogo) pelo Bruno | `apps/web/tests/e2e/` |
| Incident response escrito | Feito | [resposta-a-incidentes.md](../operacao/resposta-a-incidentes.md) |
| Exclusão de conta testada | Feito: E2E (confirma pelo e-mail, apaga, não deixa entrar de novo) e pgTAP (apaga em todas as tabelas sem tocar em outra conta) | `account.spec.ts`, `05_audit_and_account_deletion.test.sql` |
| Checklist legal concluído | **Pendente: depende de revisão jurídica.** Rascunhos no ar e checklist pronto para o profissional | [checklist-legal.md](checklist-legal.md) |

## O que entrou

- **Privacidade e termos** (rascunho, en e pt-BR) em `/privacy` e `/terms`, com aviso de revisão, índice lateral, links no rodapé e no cadastro.
- **Baixar meus dados**: JSON com todas as tabelas da conta (lido com a sessão do jogador, então nunca inclui dado de outra conta).
- **Excluir conta**: pede o e-mail da conta digitado; apaga tudo na hora e limpa a sessão.
- **Auditoria de acesso ao banco** (pgTAP): toda tabela tem RLS, visitante só lê o catálogo, o navegador nunca escolhe `user_id`.
- **Advisors do Supabase**: corrigido o aviso da função `rls_auto_enable` (criada pelo Supabase); sobra "proteção contra senha vazada", que é do plano pago.
- **Limite de abuso**: no máximo 30 importações do addon por dia por conta.
- **Eventos nos logs** (sem dados pessoais): `objective_created`, `battlenet_link_succeeded/failed`, `addon_import_succeeded/failed`, `account_exported`, `account_deleted`.
- **Backup e rollback** documentados: [backup-e-rollback.md](../operacao/backup-e-rollback.md).
- **Plano de beta**: [plano-de-beta.md](plano-de-beta.md).
- Contas de teste noturnas apagadas da produção (só a conta do Bruno ficou).
- Testes do banco agora começam do zero dentro da transação, sem depender do que já existe no banco local.

## Teste de fumaça na produção

24/10/2026, `apps/web/scripts/smoke-production.mjs` contra https://wowhelp.vercel.app: home, cadastro, objetivo, botão da Battle.net (leva ao login da Blizzard), importação do addon, filtro de montarias coletadas, exportar dados e excluir conta. Todos ok; depois disso o banco ficou só com a conta do Bruno.

## Checklist de go live (planning/docs/09)

| Item | Situação |
| --- | --- |
| Fonte oficial e limites de Battle.net confirmados | Parcial: fonte e limites documentados na Fase 0; falta teste real com conta |
| Migrations revistas e RLS auditada | Feito (63 testes pgTAP + advisors) |
| Mobile e PWA testados | Parcial: E2E no Pixel 7 e axe; falta teste em iPhone/Safari real |
| Addon testado no patch Retail vigente | **Pendente (Bruno)** |
| Retenção e exclusão de dados implementadas | Feito |
| Assets com direitos verificados | Parcial: cessão da Elianai registrada; revisar no jurídico |
| Conteúdo editorial de 30 montarias revisado | Pendente: precisa de revisão humana |
| Páginas legais e aviso de não afiliação definidos | Rascunho no ar; aviso de não afiliação em todas as páginas |
| Monitoramento e alertas funcionando | Parcial: logs na Vercel e e-mail do GitHub quando a importação falha; sem alerta de erro do site |
| Backup e rollback documentados | Feito (falta escolher Supabase Pro ou cópia manual) |
| Domínio apontado somente após validação de produção | Sem domínio próprio por enquanto (wowhelp.vercel.app) |

## Pendências que dependem do Bruno

1. Testar a Battle.net com a conta real (Personagens > Conectar).
2. Testar o addon no jogo (roteiro em [relatorio-fase-5.md](../fase-5/relatorio-fase-5.md)).
3. Revisão jurídica e decisão sobre o nome.
4. SMTP próprio para ligar a confirmação de e-mail.
5. Escolher backup: Supabase Pro ou cópia manual semanal.
6. Escolher o grupo do alpha (3 a 5 pessoas).
