# Quadro de tarefas (quest log)

Atualizado na madrugada de 24/10/2026. Tarefas de até ~4 horas, com resultado visível. `[x]` feito, `[ ]` a fazer, `[!]` depende do Bruno.

## Produção

- [x] Repositório público wowhelpbr/WoWHelp com CI
- [x] Banco "wowhelp site" com tabelas e RLS (migrations aplicadas)
- [x] Login do Supabase apontando para wowhelp.vercel.app (confirmação de e-mail desligada até haver SMTP)
- [x] Variáveis na Vercel (Supabase e Battle.net)
- [x] Cadastro, painel e objetivo salvo testados em https://wowhelp.vercel.app
- [x] Teste de fumaça completo na produção (apps/web/scripts/smoke-production.mjs), 24/10/2026
- [!] SMTP próprio (ex.: Resend) para ligar a confirmação de e-mail antes do beta público
- [x] Apagar as contas de teste `qa-noturno-*@wowhelp.test`
- [!] Escolher backup: Supabase Pro (cópia diária) ou cópia manual semanal (docs/operacao/backup-e-rollback.md)
- [ ] Proteção contra senha vazada (Supabase, plano pago)
- [ ] Alerta automático de erro do site (hoje só logs na Vercel)

## Fase 2: Battle.net

- [x] Tabelas de conexão, personagens e coleção com RLS e limpeza automática em 30 dias
- [x] Conectar (OAuth com `state`), sincronizar personagens e montarias da conta, desconectar
- [x] Tela de personagens e central de conexões
- [!] Teste real com a conta Battle.net do Bruno

## Fase 3: Montarias

- [x] Importação do catálogo oficial (Game Data API) rodando na Vercel, renovada antes de 30 dias
- [x] Catálogo com busca, filtros e status coletada / não obtida / desconhecida
- [x] Criar objetivo a partir de uma montaria
- [ ] Imagens das montarias (cópia no Storage com crédito)
- [ ] Passo a passo editorial revisado para as montarias mais buscadas

## Fase 4: Planejador

- [x] Atividades semanais do jogador com reset por região (Europa oficial; demais estimadas e sinalizadas)
- [x] Planejador de sessão de 15 / 30 / 60 / 120+ minutos
- [ ] Confirmar reset das Américas pelo addon ou fonte oficial
- [ ] Lista editorial revisada de atividades semanais do Midnight

## Fase 5: Addon

- [x] Addon Lua WoWHelp Companion (.toc 120105, SavedVariables, /wowhelp) com download no site
- [x] Importação segura do arquivo no site (sem executar Lua), com prévia, confirmação, histórico e exclusão
- [!] Teste dentro do jogo (roteiro em docs/fase-5/relatorio-fase-5.md)
- [ ] Usar o horário de reset que o addon grava para confirmar o reset das Américas
- [ ] Publicar no CurseForge/Wago (depois do teste e da decisão sobre o nome)

## Fase 6: Beta

- [x] Política de privacidade e termos (rascunho no ar, checklist para revisão em docs/fase-6/checklist-legal.md)
- [x] Exportar meus dados e excluir conta (testados de ponta a ponta)
- [x] Auditoria de RLS e advisors do Supabase
- [x] Resposta a incidentes, backup e rollback, plano de beta (docs/operacao e docs/fase-6)
- [!] Revisão jurídica, decisão sobre o nome, grupo do alpha
- [ ] Teste em iPhone/Safari real

## Monetização (ver docs/monetizacao.md)

- [!] Escolher o caminho com o jurídico: apoio voluntário, anúncios, Premium só sem anúncios ou Premium sem dados da API
- [ ] Página "Apoie o WoWHelp" (assim que houver link de apoio)

## Próximas ideias

- [x] Montarias: imagem oficial, card com profundidade, janela de detalhes, curadoria (chance de drop com fonte, local, passo a passo) e tentativas pela Battle.net (docs/fase-7/relatorio-montarias.md)
- [!] Curar as montarias mais buscadas (Bruno, em Configurações > Abrir a curadoria)
- [x] Mascotes e brinquedos no mesmo modelo das montarias (docs/fase-7/relatorio-mascotes-brinquedos.md)
- [ ] Descrição dos brinquedos (efeito de Usar, pela API do item)
- [ ] Addon Companion: importar também mascotes e brinquedos
- [x] Comunidade BR: página, curadoria, pedidos de entrada/saída, ao vivo e novidades prontos (docs/fase-7/relatorio-comunidade.md)
- [!] Criar app da Twitch e chave do YouTube e cadastrar na Vercel (passo a passo no relatório)
- [!] Cadastrar os primeiros criadores (Bruno, na curadoria)
- [ ] Kick: confirmar a API oficial para ao vivo
- [!] Modelo 3D: só com parecer jurídico (EULA proíbe extrair dados do cliente; modelos são obra da Blizzard)
