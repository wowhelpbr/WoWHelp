# WoWHelp | Plano de implementação para Cláudio

**Versão:** 1.0 | **Data:** 22 de outubro de 2026 | **Status:** documentação pronta para execução, sem infraestrutura provisionada

## Missão

Construir o WoWHelp como um companion para World of Warcraft Retail, acessível no computador e no celular, que transforme dados sobre personagens, coleções e atividades em recomendações simples e úteis.

**Proposta de valor:** menos tempo procurando guias e mais tempo jogando.

## O que entregar primeiro

1. Site Next.js responsivo com experiência instalável como PWA.
2. Contas no Supabase, perfis e preferências de idioma inglês e português brasileiro.
3. Integração oficial Battle.net sob consentimento, com personagens e coleções quando os endpoints autorizarem.
4. Dashboard com objetivos pessoais e situação da sincronização.
5. Planejador de colecionismo começando por montarias.
6. Planejador de sessões e atividades semanais, com progresso manual quando a API não trouxer o estado exato.
7. Addon WoWHelp Companion em Lua, limitado à leitura dos dados permitidos e geração de SavedVariables.
8. Importação manual de SavedVariables no site. Automação por aplicativo desktop só depois de estudo e consentimento específico.

**Recorte inicial:** Retail / Midnight, priorizando usuários casuais, retornantes e colecionadores. Classic, economia avançada, otimização de combate, PvP competitivo e redes de guildas ficam fora do MVP.

## Como ler o pacote

| Documento | Objetivo |
| --- | --- |
| docs/01_PRODUTO_E_ESCOPO.md | Visão, públicos, jornadas, funcionalidades e não objetivos |
| docs/02_FASES_E_MARCOS.md | Plano sequenciado, dependências, entregáveis e gates |
| docs/03_ARQUITETURA_TECNICA.md | Stack, serviços, fluxos, segurança e observabilidade |
| docs/04_DADOS_E_INTEGRACOES.md | Contratos de fontes, Battle.net, snapshots e proveniência |
| docs/05_WEB_PWA_E_UX.md | Navegação, telas, mobile, SEO, acessibilidade |
| docs/06_ADDON_COMPANION.md | Escopo addon, SavedVariables, importação e segurança |
| docs/07_DRIVE_E_CONTEUDO.md | Inventário de materiais reais e migração editorial |
| docs/08_BACKLOG.md | Épicos, histórias, critérios de aceite e ordem de entrega |
| docs/09_QUALIDADE_E_LANCAMENTO.md | QA, privacidade, beta, métricas e lançamento |
| docs/10_DECISOES_E_RISCOS.md | Registro de decisões e riscos com planos B |
| docs/11_REFERENCIAS.md | Fontes primárias e documentação técnica |
| technical/001_schema_initial.sql | Modelo inicial demonstrativo de banco e políticas RLS, sujeito à revisão antes de aplicar |
| technical/contracts.json | Contratos de domínio e eventos de integração |
| addon/WOWHELP_COMPANION_SPEC.md | Especificação de addon para primeira implementação |
| templates/CLAUDIO_EXECUTION_BRIEF.md | Brief operacional pronto para colar para Cláudio |

## Restrições importantes

* O addon **não** acessa a internet e não executa automações de jogo. SavedVariables são gravadas em logout ou recarga de interface, não continuamente.
* A integração Battle.net é diferente da autenticação de usuários no Supabase. O fluxo OAuth e o escopo `wow.profile` precisam ser testados no ambiente real antes de prometer dados específicos.
* Dados de conteúdo antigos, especialmente Shadowlands, não devem ser publicados como orientação atual sem revisão factual.
* Arte, marcas e materiais do Drive devem ser auditados quanto a licenças de uso, inclusive imagens relacionadas à Blizzard, antes da publicação.
* Não usar scraping em violação aos termos de terceiros. Não reutilizar automaticamente texto integral de sites concorrentes.
* Nenhuma conta, banco de produção, projeto Vercel ou repo foi criado por este pacote.

## Decisões adotadas neste planejamento

**Frontend:** Next.js App Router, React e TypeScript. **Backend gerenciado:** Supabase Auth, Postgres, Storage quando necessário. **Deploy:** Vercel com preview e produção. **UI:** Tailwind CSS e componentes acessíveis. **PWA:** manifest + service worker de escopo restrito. **Addon:** Lua e .toc. **Localização:** en-US padrão e pt-BR culturalmente localizado, nunca tradução literal automática para conteúdo editorial.

## Definição de sucesso do MVP

Um jogador autorizado consegue conectar uma conta quando a Blizzard permitir, visualizar personagens, escolher uma montaria ainda não obtida, enxergar requisitos e etapas revisados, criar um plano de sessão e utilizá-lo no celular. Se não conectar Battle.net, consegue utilizar uma experiência limitada e entender quais funcionalidades exigem dados da conta.

## Próxima ação do Cláudio

Ler `templates/CLAUDIO_EXECUTION_BRIEF.md`, criar um repositório sob a organização escolhida, gerar o monorepo e abrir a primeira PR apenas com fundação, esquema de dados revisado, testes e configuração de ambientes. Não usar chaves de produção ou subir assets privados como conteúdo público antes da aprovação.
