# Identidade visual e pesquisa de layout

> **Versão 2 (24/10/2026):** o site passou para o sistema **neon** (skill `neon-creator-design-system`): fundo grafite-azulado, limão para ação, ciano para dado em destaque e roxo para o botão de marca. Proposta aprovada pelo Bruno em [proposta-layout-neon.html](proposta-layout-neon.html); tokens em `apps/web/src/app/globals.css`. O texto abaixo é a versão 1 (HUD azul e ouro), mantido como histórico.

Versão 1 (23/10/2026). Direção pedida pelo Bruno: sistema **HUD escuro** (skill `hud-dark-design-system`) com as cores do WoWHelp, na linha do **Heroes of the Storm**: azul com amarelo.

## Pesquisa de referências (23/10/2026)

Capturas da primeira tela de cada site, só para estudo de estrutura (não ficam no repositório).

| Referência | O que observei | O que levamos |
| --- | --- | --- |
| heroesofthestorm.blizzard.com (home e heróis) | Fundo índigo profundo, cards com borda azul-elétrica, filtros em "chips" retangulares com ícone, motivo de hexágonos (o Nexus), barra de navegação flutuante com recuo das bordas | Paleta azul-noite + azul-elétrico, colmeia hexagonal sutil, marcadores em hexágono, cabeçalho flutuante |
| worldofwarcraft.blizzard.com | Botão principal amarelo-ouro com texto escuro, botão secundário só com contorno dourado, sublinhado dourado na aba ativa, rótulos de botão em maiúsculas | Hierarquia de botões (primário ouro, secundário contorno), aba ativa com sublinhado dourado |
| mobalytics.gg | "Companion" multi-jogo: herói com uma pergunta grande e logo abaixo uma grade de escolhas com arte | Home = pergunta + grade de objetivos logo abaixo, sem rodeios |
| wowthing.org | Área logada com menu lateral por tipo de dado (moedas, equipamento, montarias, pets) e tabela densa para alts | Menu lateral da conta no desktop, com seções futuras marcadas pela fase |
| raider.io | Barra superior com versão do jogo, busca em destaque, navegação em linha, acentos dourados | Busca fica para quando houver catálogo (Fase 3) |
| dataforazeroth.com | Bloqueou acesso automatizado | — |

Pesquisa anterior (v0) usou a metáfora do registro de missões do próprio jogo; ela continua no produto (objetivos como missões, "!" para disponível, rastreador) e foi traduzida para o visual HUD.

## Layout: tela cheia (decisão do Bruno, 23/10/2026)

Nada de coluna centralizada com largura máxima. Tudo ocupa a largura da tela, com respiro lateral que cresce com o monitor (`gutter` em `components/ui/container.tsx`: 16 → 24 → 40 → 56 px).

- **Cabeçalho:** barra de ponta a ponta, fixa no topo, sublinhado dourado na seção ativa.
- **Home:** herói com a altura da tela (colmeia + brilho azul + mago grande à direita) e botão que desce até os objetivos; objetivos em cards verticais em 4 colunas (2 no tablet, 1 no celular) com o rastreador fixo ao lado.
- **Área logada:** formato de aplicativo, com menu lateral colado na borda esquerda (altura total) e conteúdo ocupando o resto.
- **Entrar / criar conta:** tela dividida, formulário de um lado e arte com colmeia ocupando a outra metade.
- **404 e offline:** composição em duas colunas com ilustração grande.

Textos longos continuam com largura limitada (cerca de 70 caracteres por linha) para não cansar a leitura.

## Tokens

Definidos em `apps/web/src/app/globals.css` (bloco `@theme`). Nunca usar cores literais do Tailwind para marca.

| Token | Valor | Uso |
| --- | --- | --- |
| `background` | `#090e22` | Fundo da página |
| `sidebar` | `#070b1b` | Barra superior, menu lateral, abas do celular |
| `card` / `card-raised` | `#0f1734` / `#16214a` | Painéis |
| `border` / `border-strong` | `#22346c` / `#3a55a6` | Bordas de 1 px, sempre visíveis |
| `foreground` / `muted-foreground` | `#eef1fb` / `#9aa6cc` | Texto principal e secundário (contraste AA verificado com axe) |
| `primary` | `#ffc629` | Ouro do medalhão: ação, seleção, foco, progresso |
| `neon` | `#3cc8ff` | Azul do Nexus: estrutura, rótulos "//", ícones informativos |
| `success`, `warning`, `danger`, `unknown` | `#4ade80`, `#f59e0b`, `#ff5d6c`, `#8b94b4` | Estados de dado; nunca reutilizar ouro ou azul para estado |

Regra: **ouro = o que o jogador pode fazer**; **azul = como o sistema está organizado**.

## Tipografia

Chakra Petch (Google Fonts, licença aberta) em tudo: geométrica e angular, combina com o lado "tecnológico" do Nexus sem brigar com o logo de pedra e ouro. Pesos 400 a 700. Títulos em 700; títulos de painel em maiúsculas com losango azul; rótulos técnicos com `.eyebrow` ("// TEXTO").

## Componentes e utilitários

- `.frame`: painel com borda de 1 px e canto de 0,25 rem. Sem sombra macia.
- `.corner-brackets`: cantoneiras douradas de retícula. Só em painéis de destaque (rastreador, próximas ações, objetivo escolhido).
- `.hex-grid`: colmeia hexagonal azul a 9% de opacidade. Só na faixa de herói. Nunca em listas ou tabelas.
- `.quest-mark`: hexágono dourado com "!" (disponível) ou preenchido com ✓/número (aceito).
- Botões: primário ouro com texto escuro em maiúsculas; secundário com contorno dourado; fantasma para ações discretas.
- Movimento: um único momento (a ilustração do herói chega ao abrir a home); respeita "reduzir movimento".

## Marca e ilustrações

Logo, medalhão e ilustrações de classe da Elianai dos Santos (eliz00r). Uso e crédito em `docs/fase-0/inventario-de-assets.md`. Ilustrações são decorativas (texto alternativo vazio), redimensionadas sem recorte.

## O que fica para depois

- Variação clara (light) do tema: não prevista no MVP.
- Telas de catálogo com filtros em "chips" no padrão HotS (Fase 3).
- Revisão de marca com o Bruno antes do beta.
