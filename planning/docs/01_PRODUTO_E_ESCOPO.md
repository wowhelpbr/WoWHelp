# 01 | Produto e escopo

## Problema

O jogador consulta Wowhead, Raider.IO, WoWthing, Simple Armory e outros serviços para resolver perguntas simples. A carga de navegação e síntese de informação é transferida para o usuário.

## Hipótese

Uma ferramenta que conhece objetivos pessoais e combina dados de fontes autorizadas pode reduzir a quantidade de buscas, cliques e decisões necessárias para planejar uma sessão de jogo.

## Segmentos prioritários

1. **Retornante:** não sabe quais sistemas e conteúdos são relevantes agora.
2. **Casual com pouco tempo:** deseja usar sessões de 15, 30 ou 60 minutos.
3. **Colecionador:** quer montarias faltantes, pré requisitos, rotas e tarefas.
4. **Jogador com vários personagens:** precisa organizar objetivos e calendário sem replicar a mesma tarefa.

Jogadores competitivos avançados são audiência secundária em fases futuras.

## Proposta principal

**Pergunta de entrada:** What do you want to do today?

Resposta do produto: um plano de ações, contextualizado pelo personagem, região, coleção, objetivo, tempo disponível, disponibilidade de eventos e confiabilidade do dado. Quando faltar informação, o sistema solicita um passo manual e informa a origem e a data da última sincronização.

## Entrega mínima

* Site público com catálogo inicial de montarias selecionadas e páginas editoriais atualizadas.
* Login de usuário com Supabase Auth e vinculação separada Battle.net via OAuth sob consentimento.
* Escolha de personagem, região e objetivos.
* Dashboard indicando dados disponíveis, indisponíveis e desatualizados.
* Catálogo de pelo menos 30 montarias revisadas manualmente, com requisitos, obtenção, expansão, localização, fonte e estado de revisão.
* Seleção de uma montaria como objetivo, checklist e progresso próprio.
* Planejador de atividades com duração estimada e tarefas semanais editoriais revisadas, sem supor que o jogo sempre forneça os status.
* Layout responsivo e PWA instalável onde houver suporte.
* Protótipo do addon com exportação controlada e importação manual no site.

O requisito de 30 montarias é um alvo de escopo editorial, não uma alegação de completude. Ajustar ao resultado da auditoria de conteúdo.

## Fora do MVP

* Reprodução completa de Wowhead, Raider.IO, Warcraft Logs ou Raidbots.
* Coleta automática de dados em combate ou processamento de valores secretos de Midnight.
* Desktop uploader automático, aplicativo nativo iOS ou Android, marketplace e anúncios.
* Sincronização em tempo real com o addon, comunicação externa direta de Lua.
* Recrutamento de guildas, chat social e otimização avançada de leilões.

## Jornadas principais

### Jornada A | sem login

Abre página de uma montaria, vê onde obter, requisitos, fontes, data de atualização e salva um roteiro local não sensível ou cria conta para guardar objetivos.

### Jornada B | com conta e Battle.net

Inicia sessão, autoriza acesso, seleciona personagem e verifica a coleção. O aplicativo identifica uma montaria ainda não registrada na conta com base em dado oficial; se a API não responder, marca o estado como desconhecido.

### Jornada C | uso mobile

Abre a PWA no celular, seleciona objetivo de 30 minutos, consulta checklist e marca etapas manualmente. Quando sem rede, conteúdo sensível não deve ficar exposto por cache compartilhado.

### Jornada D | addon

Instala addon, executa /reload ou sai do jogo, localiza SavedVariables e importa o arquivo no site. O site mostra prévia das categorias a importar e pede confirmação.

## Métricas do beta

* Tempo até encontrar uma ação concreta para executar.
* Taxa de criação do primeiro objetivo.
* Percentual que finaliza ao menos uma etapa em sete dias.
* Erros de vinculação Battle.net e sincronização.
* Uso mobile, conclusão de fluxo e frequência de retorno.
* Qualidade do conteúdo: percentual com fonte, revisão, expansão e data.

As metas numéricas devem ser definidas depois de medir um grupo piloto, sem usar projeções de audiência inventadas.
