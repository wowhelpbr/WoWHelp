# Quadro de tarefas (quest log)

Atualizado durante a noite de 23/10/2026. Tarefas de até ~4 horas, com resultado visível. `[x]` feito, `[ ]` a fazer, `[!]` depende do Bruno.

## Produção

- [x] Repositório público wowhelpbr/WoWHelp com CI
- [x] Banco "wowhelp site" com tabelas e RLS (migrations aplicadas)
- [x] Login do Supabase apontando para wowhelp.vercel.app (confirmação de e-mail desligada até haver SMTP)
- [x] Variáveis na Vercel (Supabase e Battle.net)
- [x] Cadastro, painel e objetivo salvo testados em https://wowhelp.vercel.app
- [!] SMTP próprio (ex.: Resend) para ligar a confirmação de e-mail antes do beta público
- [ ] Apagar as contas de teste `qa-noturno-*@wowhelp.test` (via exclusão de conta da Fase 6)

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

- [ ] Atividades semanais do jogador com reset por região (fonte oficial)
- [ ] Planejador de sessão de 15 / 30 / 60 / 120+ minutos

## Fase 5: Addon

- [ ] Addon Lua WoWHelp Companion (.toc 120105, SavedVariables, /wowhelp)
- [ ] Importação segura do arquivo no site (sem executar Lua), com prévia e confirmação
- [!] Teste dentro do jogo

## Fase 6: Beta

- [ ] Política de privacidade e termos (rascunho para revisão jurídica)
- [ ] Exportar meus dados e excluir conta
- [!] Revisão jurídica, decisão sobre o nome, grupo de beta
