# 08 | Backlog de execução por épico

Ordem de prioridade: P0 obrigatório antes da primeira beta, P1 importante para beta, P2 depois da beta. Cada história exige PR, teste, screenshot mobile e aceite funcional.

## EPIC 00 | Discovery e permissão

* **WH-001 P0** Validar contas Battle.net, permissões `wow.profile`, regiões, endpoints e quotas. Aceite: relatório com respostas reais ou motivo do bloqueio.
* **WH-002 P0** Inventariar Drive, direitos e fontes editoriais. Aceite: checklist para cada asset selecionado.
* **WH-003 P0** Aprovar wireframes e mapa de navegação. Aceite: fluxos sem login, com login e mobile.

## EPIC 01 | Plataforma

* **WH-010 P0** Criar repo Next.js TypeScript e setup inicial. Aceite: lint, testes e build verdes.
* **WH-011 P0** Integrar Supabase Auth e SSR. Aceite: login, logout e rotas protegidas sem vazamento de sessão.
* **WH-012 P0** Criar migrations e RLS. Aceite: testes de isolamento usuário A / usuário B.
* **WH-013 P0** Configurar preview da Vercel e staging. Aceite: PR gera preview testável.
* **WH-014 P0** i18n en-US/pt-BR. Aceite: trocar locale em todas as telas base.
* **WH-015 P1** PWA manifest, instalação e página offline pública. Aceite: install e testes Android/iOS suportados.

## EPIC 02 | Battle.net

* **WH-020 P0** OAuth de vinculação e revogação. Aceite: consentimento, state, callback e disconnect testados.
* **WH-021 P0** Importar lista de personagens disponíveis. Aceite: deduplicação por ID/realm/região.
* **WH-022 P0** Obter e normalizar coleção de montarias quando API permitir. Aceite: tri state e timestamps.
* **WH-023 P1** Jobs de refresh e limites de chamadas. Aceite: 429/5xx tratados, requisições idempotentes.

## EPIC 03 | Coleções

* **WH-030 P0** Inserir lote editorial verificado de montarias. Aceite: 30 entradas, fonte e revisão.
* **WH-031 P0** Busca e filtros. Aceite: resultado mobile em menos de 3 interações comuns.
* **WH-032 P0** Criar objetivo de montaria. Aceite: propriedade exclusiva da conta, checklist persistente.
* **WH-033 P1** Recomendação por requisitos e tempo. Aceite: justificativa e dado desconhecido explícito.

## EPIC 04 | Plano semanal

* **WH-040 P0** Tabela de atividades e calendário por região. Aceite: regras de reset verificadas.
* **WH-041 P0** Gerador de plano de sessão por duração. Aceite: quatro opções de duração, ordenação estável e explicável.
* **WH-042 P0** Marcar atividades manualmente. Aceite: status persistente por escopo de conta/personagem.
* **WH-043 P1** Resumo de alts. Aceite: troca de personagem não mistura progresso.

## EPIC 05 | Addon

* **WH-050 P0** Prototipar addon e relatório de APIs permitidas. Aceite: sem acesso a dados secretos, `/wowhelp` funciona.
* **WH-051 P1** Persistência versionada em SavedVariables. Aceite: restauração depois de `/reload` e logout.
* **WH-052 P1** Importação e validação de snapshot. Aceite: parser seguro e payload malicioso rejeitado.
* **WH-053 P1** Consentimento e preview da importação. Aceite: usuário seleciona categorias.

## EPIC 06 | Qualidade

* **WH-060 P0** E2E para login, coleções, objetivo e sessão. Aceite: desktop e mobile.
* **WH-061 P0** Auditoria RLS e segredos. Aceite: zero leitura cruzada, nenhuma key secreta no browser.
* **WH-062 P0** Privacidade, exportação e exclusão. Aceite: fluxos testados e documentação revisada.
* **WH-063 P1** Beta observabilidade e métricas. Aceite: erros classificados e eventos úteis.
* **WH-064 P1** Testes com jogadores. Aceite: 5 entrevistas exploratórias e pelo menos 10 sessões orientadas com resultados documentados; tamanhos são metas iniciais, não amostra estatística.

## EPIC 07 | Depois da beta

* **WH-070 P2** Housing planner.
* **WH-071 P2** Coleções de pets, toys e transmogs.
* **WH-072 P2** Sincronizador desktop opcional.
* **WH-073 P2** Serviços de performance e economia condicionados a licenciamento e API.
* **WH-074 P2** Aplicativo mobile nativo se PWA demonstrar limites claros.

## Definition of Done

Código revisado, testes verdes, segurança, conteúdo com proveniência, acessibilidade básica, UX responsiva, i18n e nota de release. Uma story sem critério de aceite demonstrado não está concluída.
