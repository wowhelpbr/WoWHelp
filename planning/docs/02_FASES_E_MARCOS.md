# 02 | Fases, marcos e gates

Cronograma de referência para um desenvolvedor principal com colaboração editorial parcial. Estimativas não são compromisso de entrega. Design e conteúdo podem ocorrer paralelamente.

| Fase | Horizonte indicativo | Resultado verificável |
| --- | --- | --- |
| 0. Descoberta e decisões | Semana 1 | Escopo final, dados acessíveis, autorização de uso de assets, protótipo UX |
| 1. Fundação e Web/PWA | Semanas 2 e 3 | Repositório, auth, ambiente preview, design responsivo e CI |
| 2. Battle.net e personagem | Semanas 4 e 5 | OAuth validado, perfis, catálogo, atualização e erros tratados |
| 3. Montarias e objetivos | Semanas 6 e 7 | Catálogo curado, filtros, objetivo, checklist e provenance |
| 4. Planejador semanal | Semanas 8 e 9 | Atividades, tempo por sessão e conclusão manual |
| 5. Companion addon | Semanas 10 e 11 | Addon funcional, SavedVariables, importação validada |
| 6. Beta e publicação | Semana 12 em diante | Testes, auditoria, monitoramento, rollout gradual |

Se a API Battle.net bloquear fases 2 ou 3, priorizar catálogo público, objetivos manuais e conta própria; não fingir acesso a dados da Blizzard.

## Fase 0 | validação

**Tarefas:** mapear fontes e ToS; definir Retail / região / expansão; testar escopo `wow.profile` e endpoints em sandbox ou aplicação registrada; revisar dados antigos do Drive; escolher 30 montarias candidatas; mapear permissão de uso de logotipos e arte; esboçar homepage e dashboard.

**Gate:** documento de cobertura de dados reais, inventário com estado de direito autoral e aceite do layout principal. Sem esse gate, não assumir que coleta de personagens funciona.

## Fase 1 | plataforma

**Tarefas:** setup Next.js + TypeScript + lint + formatter + testes; Supabase Auth para sessão WoWHelp; migrations e RLS; Vercel preview e produção separadas; i18n en-US/pt-BR; componentes mobile first; PWA manifest e install flow; telemetria respeitando consentimento.

**Gate:** usuário autenticado cria e lê seus próprios objetivos; outro usuário não consegue ler esses registros; preview aprovado no celular e desktop.

## Fase 2 | integração oficial

**Tarefas:** registrar cliente Battle.net; OAuth Authorization Code com state e PKCE se suportado, conforme documentação oficial; associar conta vinculada a user_id no servidor; consultar regiões, personagens e coleções disponíveis; mapear rate limits, falhas e revogação; cache com validade e origem.

**Gate:** autorização funcional com conta de teste, revogação funcional, erros claros, nenhuma credencial no browser ou logs, zero dados de usuário cruzados.

## Fase 3 | colecionismo

**Tarefas:** normalizar IDs da Blizzard; catálogo e filtros; status collected / missing / unknown; regra de elegibilidade; fonte e última revisão; recomendações simples com explicações; objetivos individuais e checklist.

**Gate:** 30 entradas validadas; pesquisa, filtro e criação de objetivo funcionam em celular; estados desconhecidos não viram 'não obtidos'.

## Fase 4 | plano semanal

**Tarefas:** entidade activity_templates; janelas de reset por região, calculadas a partir de fonte confiável; duração editorial; dependências; agenda priorizada por sessão de 15, 30, 60 ou 120+ min; progresso manual por personagem ou conta.

**Gate:** plano evita tarefas bloqueadas, separa atividade semanal de permanente, e explicita estimativas.

## Fase 5 | addon

**Tarefas:** `.toc`, SavedVariables versionadas, captura de campos permitidos, UI de status e comando `/wowhelp`; importação manual no site com validação estrita e confirmação; marcação de snapshots locais; teste de 2 personagens e reload/logout.

**Gate:** addon leve, sem automações proibidas, sem captura de dados de combate secretos, sem envio HTTP; a importação rejeita conteúdo malicioso ou malformado sem executar Lua.

## Fase 6 | beta

**Tarefas:** testes E2E desktop e mobile; audit de RLS; acessibilidade; termos e privacidade LGPD; métricas; testes com usuários; monitoramento de erros; backup e rollback; lançamento gradual.

**Gate:** fluxos críticos aprovados, incident response escrito, política de exclusão de conta testada e checklist legal concluído.

## Regra de execução

Cada fase começa com critério de aceite e termina com demonstração gravada, PR revisada, changelog curto, testes executados e lista de itens pendentes. Nunca mover work in progress para produção apenas porque funciona na máquina local.
