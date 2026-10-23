# Fase 0 | Descoberta e decisões: relatório

Data: 23/10/2026. Gate da fase (planning/docs/02): documento de cobertura de dados reais, inventário com estado de direito autoral e aceite do layout principal.

## Situação do gate

| Item do gate | Situação | Onde está |
| --- | --- | --- |
| Cobertura de dados reais (Battle.net e addon) | **Parcial.** Documentação oficial lida e citada; teste com conta real depende de cliente registrado | [cobertura-de-dados-battlenet-e-addon.md](cobertura-de-dados-battlenet-e-addon.md) |
| Inventário de assets com direitos | **Feito** para a pasta recebida em 23/10; contrato de cessão encontrado e lido | [inventario-de-assets.md](inventario-de-assets.md) |
| Aceite do layout principal (home e painel) | **Aguardando o Bruno.** Layout implementado de verdade, não só wireframe | `docs/screenshots/` e [identidade-visual.md](../design/identidade-visual.md) |
| 30 montarias candidatas | **Não iniciado de propósito.** Sem fonte verificada não entra nenhuma; o caminho é o índice oficial da Game Data API (precisa de credencial) mais revisão editorial | Fase 3 |

## Inventário de decisões, hipóteses e riscos do pacote

### Decisões confirmadas e aplicadas

- Retail / Midnight primeiro (D01); Next.js na Vercel (D02); Supabase com RLS (D03); PWA antes de app nativo (D04); addon sem HTTP (D05); Battle.net como vínculo separado do login (D06).
- en-US como idioma principal, pt-BR como localização cultural (não tradução literal).
- Tri-state de coleção (`collected`, `not_collected`, `unknown`): implementado no pacote de domínio com testes.

### Hipóteses agora verificadas

| Hipótese do pacote | Resultado |
| --- | --- |
| Escopo `wow.profile` dá acesso a personagens e coleções | **Confirmado** na documentação: personagens e coleções da conta (montarias, mascotes, brinquedos, heranças, transmog e decoração) |
| Battle.net é provedor nativo do Supabase | **Não é.** Pode entrar como provedor personalizado; a decisão D06 (vínculo separado) continua válida |
| PKCE suportado | **TBD**: não anunciado no host global; testar com o cliente registrado |
| Refresh token | **TBD**: não documentado; planejar sincronizar logo após o login |
| Addon consegue ler montarias no Midnight | **Confirmado na documentação** (`C_MountJournal` sem retorno "secreto" na build 12.1.5); falta teste no jogo |
| Versão de interface do addon | `## Interface: 120105` (Retail 12.1.5 ao vivo em 23/10/2026) |

### Riscos novos encontrados

| ID | Risco | Mitigação |
| --- | --- | --- |
| R10 | **Nome "WoWHelp"** e os Termos da API ("sem marcas da Blizzard no título ou na URL") | Decisão jurídica antes da Fase 2; não registrar domínio com "WoW" antes disso |
| R11 | **Retenção máxima de 30 dias** para dados da API | Modelo de dados com `fetched_at` e rotina de limpeza/revalidação na Fase 2 |
| R12 | **Monetização restrita** (nada "premium" pago que use a API) | Registrar como restrição de produto; qualquer plano pago precisa de análise |
| R13 | Ilustrações retratam IP da Blizzard (arte de fã) | Uso gratuito e sem afiliação; revisão jurídica antes de monetizar |
| R14 | Contrato de cessão contém dados pessoais | Pasta de artes fora do git; nunca publicar |

## Pendências que dependem do Bruno

1. **Registrar o cliente no portal da Blizzard** (develop.battle.net) com a conta do WoWHelp, autenticador ligado e aceite dos Termos, para destravar a Fase 2.
2. **Decidir o nome/domínio** diante da cláusula de marcas.
3. **Aprovar o layout** (home e painel) a partir das capturas em `docs/screenshots/`.
4. Confirmar a autoria dos EPS em `Logo_wowhelp` e os direitos dos textos da Juliana.
