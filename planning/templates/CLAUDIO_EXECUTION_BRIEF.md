# Brief para Cláudio | Início imediato do WoWHelp

## Contexto

Vamos retomar o WoWHelp usando materiais antigos existentes no Google Drive, construindo um assistente para World of Warcraft Retail com experiências desktop, mobile PWA e addon Companion. A solução usa **Next.js + TypeScript + Vercel + Supabase**. A plataforma deve resolver dores reais do usuário e não ser apenas um diretório de links.

## Prioridade

Entrega incremental e testável, com base no roadmap. Comece pela Fase 0 e Fase 1. Não avance para integrações ou publicação de conteúdo sem validar direitos de uso, scopes e APIs.

## Passos iniciais

1. Leia todos os arquivos do pacote e faça um inventário das decisões técnicas, hipóteses e riscos.
2. Apresente estrutura de repositório, esquema de dados e wireframe de homepage/dashboard antes do primeiro PR com feature.
3. Crie Next.js com layout mobile first, en-US e pt-BR, biblioteca de componentes acessíveis, auth do Supabase e páginas protegidas.
4. Configure banco com RLS, migrations, teste de isolamento, staging e preview deployments na Vercel.
5. Faça spike técnico Battle.net: OAuth, endpoints de coleção, regiões, rate limit, consentimento e revogação. Registre evidências dos testes.
6. Implemente catálogo de 30 montarias editadas e revisadas, lista de objetivos e planner simples.
7. Prototipe addon Lua compatível com Midnight; grave SavedVariables locais e faça upload manual seguro no site.
8. Execute E2E, revisão legal e beta fechado antes de vincular domínio ao ambiente de produção.

## Regras não negociáveis

* Jamais usar dados de terceiros em violação de ToS, nem copiar guias integralmente.
* Jamais expor segredos Supabase ou Battle.net no frontend.
* Jamais executar scripts Lua enviados pelo usuário.
* Jamais presumir que dado não retornado significa que item não está coletado.
* Jamais prometer sincronização do jogo em tempo real com addon puro.
* Jamais usar conteúdo Shadowlands do Drive como orientação atual sem revisão.
* Conservar os arquivos originais do Drive, sem modificação.
* Todas as features devem funcionar no celular desde o início.
* Não fazer deploy de produção ou mutações em contas existentes sem autorização.

## Formato das entregas

Cada feature precisa de PR, testes, screenshots mobile e desktop, referência de fonte, notas sobre segurança e um vídeo curto da jornada. Ao fim de cada fase, mostrar resultado funcionando, riscos abertos e próximo gate.

## Primeira demonstração esperada

Um ambiente de preview onde é possível navegar entre home, catálogo, login e painel pessoal, em inglês e português brasileiro. O usuário logado cria um objetivo simples, recarrega a página e mantém seu progresso, sem vazamento entre contas.

## Referências do Drive

Pasta base: https://drive.google.com/drive/folders/1Rf1jb6vGhbdPrWSXvCGYL372tBQ89hgQ
Logos: https://drive.google.com/drive/folders/1TU1X9onU4_SBtrAEMsYRwKB9Tp7QunkZ
Documentos editoriais: https://drive.google.com/drive/folders/1Ur2RkaSIdI-f3oo_6mg8H15JD29gWg76
Ilustrações: https://drive.google.com/drive/folders/18sM0ApRKkYjtIYgewgfitETABhguVucg

## Entregável técnico inicial

Usar o arquivo SQL de referência apenas após análise e adaptação. Não aplicá-lo automaticamente a um banco de produção. Validar o fluxo de auth no contexto dos cookies SSR e seguir a documentação oficial atual da Supabase.
