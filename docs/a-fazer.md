# Quadro de tarefas (quest log)

Atualizado em 24/10/2026. Tarefas de até ~4 horas, com resultado visível. `[x]` feito, `[ ]` a fazer, `[!]` depende do Bruno.

## Produção

- [!] Apontar o DNS de wowhelp.com.br na Hostinger (docs/operacao/dominio.md); domínio já está no projeto da Vercel
- [!] Adicionar o retorno da Battle.net com o domínio novo

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
- [x] Imagens das montarias (cópia no Storage com crédito)
- [ ] Passo a passo editorial revisado para as montarias mais buscadas

## Fase 4: Planejador

- [x] Atividades semanais do jogador com reset por região (Europa oficial; demais estimadas e sinalizadas)
- [x] Planejador de sessão de 15 / 30 / 60 / 120+ minutos
- [ ] Confirmar reset das Américas pelo addon ou fonte oficial
- [ ] Lista editorial revisada de atividades semanais do Midnight

## Fase 5: Addon

- [x] Addon Lua WoWHelp Companion (.toc 120105, SavedVariables, /wowhelp) com download no site
- [x] Importação segura do arquivo no site (sem executar Lua), com prévia, confirmação, histórico e exclusão
- [x] Simulação do addon fora do jogo (Lua de verdade + WoW de mentira, 8 cenários)
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

- [x] Anúncios AdSense + aviso de cookies prontos (desligados até a conta do AdSense)
- [!] Criar a conta do AdSense com wowhelp.com.br e mandar o número ca-pub (docs/monetizacao.md)
- [x] Site privado com senha definida em Administração > Site privado
- [x] Assinatura "WoWHelp Apoiador" pelo Stripe em modo de teste: página Seja apoiador, sem anúncios para quem assina, selo, portal para cancelar, Administração > Assinaturas (docs/operacao/stripe.md)
- [!] Decidir os preços (hoje R$ 9,90/mês e R$ 99/ano, provisórios)
- [!] Ativar a conta real do Stripe (CNPJ, banco) e passar a assinatura pelo jurídico; depois eu copio tudo para a conta real

## Próximas ideias

- [x] Montarias: imagem oficial, card com profundidade, janela de detalhes, curadoria (chance de drop com fonte, local, passo a passo) e tentativas pela Battle.net (docs/fase-7/relatorio-montarias.md)
- [!] Curar as montarias mais buscadas (Bruno, em Configurações > Abrir a curadoria)
- [x] Mascotes e brinquedos no mesmo modelo das montarias (docs/fase-7/relatorio-mascotes-brinquedos.md)
- [x] Descrição dos brinquedos (efeito de Usar, pela API do item)
- [ ] Addon Companion: importar também mascotes e brinquedos
- [x] Comunidade BR: página, curadoria, pedidos de entrada/saída, ao vivo e novidades prontos (docs/fase-7/relatorio-comunidade.md)
- [!] Criar a chave do YouTube e os apps da Kick e da Twitch e cadastrar com scripts/cadastrar-chave-vercel.ps1 (passo a passo no relatório)
- [!] Cadastrar os primeiros criadores (Bruno, na curadoria)
- [x] Kick: ao vivo pela Public API oficial (falta a chave)
- [!] Modelo 3D: só com parecer jurídico (EULA proíbe extrair dados do cliente; modelos são obra da Blizzard)

## Visual e experiência

- [x] Proposta do layout neon aprovada pelo Bruno (docs/design/proposta-layout-neon.html)
- [ ] Aplicar o layout neon no site inteiro e publicar
- [ ] Gamificar o site com motion.dev (próxima tarefa, pedida pelo Bruno em 24/10/2026): definir antes quais tipos de diversão servir
