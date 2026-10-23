# Changelog

## 0.5.0 (prévia, sem divulgação) | 24/10/2026

Fases 2 a 5.

- Battle.net: conexão OAuth por região, personagens e montarias da conta, desconexão, limpeza automática em 30 dias.
- Catálogo oficial de montarias (Game Data API, en-US e pt-BR) com busca, filtros, status coletada / não obtida / desconhecida, marcação manual e "transformar em objetivo".
- Planejador semanal com reset por região (Europa oficial, demais estimadas e sinalizadas) e planejador de sessão de 15 a 120+ minutos com tempo estimado por passo.
- Addon WoWHelp Companion 0.1.0 (Midnight, interface 120105) e página "Importar addon": prévia, escolha do que importar, histórico, exclusão. Leitor do arquivo sem executar Lua.
- Correção: catálogo e coleção com mais de 1000 itens eram cortados pela paginação da API do Supabase.
- Testes: 82 unitários do domínio, 29 do site, 58 de banco, 60 E2E.

## 0.1.0 (não publicado) | 23/10/2026

Primeira entrega (Fases 0 e 1).

- Monorepo Next.js 16 + TypeScript com pacote de domínio compartilhado.
- Home "What do you want to do today?" com escolha de objetivos e rastreador.
- Contas WoWHelp (Supabase Auth): cadastro, login, saída, confirmação de e-mail.
- Painel: próximas ações, objetivos com checklist, áreas de foco, fontes de dados, números do progresso.
- Configurações: idioma, região do jogo, instalação do app, privacidade.
- Catálogo de montarias (estrutura e estado "em revisão"; sem conteúdo inventado).
- Inglês e português do Brasil.
- PWA: manifest, ícones oficiais, service worker sem cache de dados da conta, página offline.
- Banco: perfis, objetivos, etapas e catálogo com RLS, grants por coluna e limites por conta.
- Visual HUD com as cores do WoWHelp (linha Heroes of the Storm), logo e ilustrações oficiais da Elianai dos Santos.
- Testes: 44 unitários, 27 de banco, 40 E2E (desktop, celular e acessibilidade); CI no GitHub Actions.
- Pesquisa da Fase 0: cobertura de dados Battle.net e addon, inventário de assets e direitos.
