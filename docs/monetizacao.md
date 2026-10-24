# Monetização

Pedido do Bruno: monetizar desde o dia zero, copiando o modelo do Wowhead (site grátis com anúncios + assinatura Premium sem anúncios), adaptado ao WoW e ao público brasileiro.

## O modelo do Wowhead (pesquisado em 24/10/2026)

Fontes: [Wowhead Premium](https://www.wowhead.com/premium), [anúncio dos novos planos](https://www.wowhead.com/news/wowhead-premium-update-new-look-additional-tiers-yearly-legendary-gift-more-354945), [Wikipedia](https://en.wikipedia.org/wiki/Wowhead).

- **Grátis com anúncios:** banners e vídeo em todo o site para quem não assina.
- **Premium em três planos**, todos sem nenhum anúncio para quem está logado:
  - **Rare** (US$ 2/mês, US$ 9/ano): sem anúncios, layout melhor, página inicial personalizada, filtros de notícias.
  - **Epic** (US$ 5/mês, US$ 30/ano): o do Rare + imagens do visualizador sem marca d'água + suporte prioritário.
  - **Legendary** (US$ 99/ano): tudo + presente físico anual.
  - Todos: cargo no Discord, identificação no site (cor do nome, avatar), mais perfis de personagem acompanhados.

## O que já está pronto no WoWHelp

| Parte | Situação |
| --- | --- |
| Anúncios do Google AdSense | **Pronto, desligado.** Três lugares: página inicial (abaixo da escolha de objetivos), catálogos (acima da lista) e Comunidade BR. Sempre identificados como "Publicidade" |
| Aviso de cookies (LGPD) | **Pronto, desligado.** Só aparece quando os anúncios ligam. "Aceitar anúncios personalizados" ou "Só o necessário" (anúncios não personalizados). O AdSense só carrega depois da escolha. "Preferências de cookies" no rodapé |
| `ads.txt` | Pronto: sai sozinho com o número do AdSense |
| Política de privacidade | Ganha a seção "Anúncios" e o texto de cookies muda sozinho quando os anúncios ligam |
| Assinatura | **Falta decidir** a forma de pagamento (abaixo) |

Para ligar os anúncios: cadastrar `NEXT_PUBLIC_ADSENSE_CLIENT` (o número `ca-pub-...`) e os blocos `NEXT_PUBLIC_ADSENSE_SLOT_HOME`, `NEXT_PUBLIC_ADSENSE_SLOT_CATALOG` e `NEXT_PUBLIC_ADSENSE_SLOT_COMMUNITY` na Vercel e publicar de novo. Não são segredos (aparecem na página).

## O que o Bruno precisa fazer (anúncios)

1. Deixar o site no ar em **wowhelp.com.br** (passo a passo em `docs/operacao/dominio.md`). O AdSense não aceita endereço `vercel.app`.
2. Criar a conta em https://adsense.google.com com a conta Google do WoWHelp, informando o site `wowhelp.com.br`. Para receber em reais, o Google pede CPF ou CNPJ e dados de pagamento.
3. O Google pede para colocar um código no site e confere o `ads.txt`: me mande o número `ca-pub-...` (não é segredo) e eu ligo.
4. A aprovação do Google costuma levar de alguns dias a algumas semanas e exige conteúdo próprio e política de privacidade (já temos).
5. No painel do AdSense, crie três blocos de anúncio "Display" (Início, Catálogo, Comunidade) e me passe os números.

## Assinatura: as regras que pesam

O WoWHelp usa a API oficial da Blizzard; os termos da API (resumo em `docs/fase-0/cobertura-de-dados-battlenet-e-addon.md`, A8) **proíbem** versão "Premium" com recursos pagos e cobrar pelo acesso a recursos que usam a API. O Wowhead não depende da API (os dados dele vêm do próprio jogo), por isso pode.

Proposta para ficar dentro das regras: **"WoWHelp Apoiador"**, que tira os anúncios e dá só benefícios sem dados da Blizzard: selo de apoiador no perfil e na Comunidade BR, cargo no Discord, cor do nome, prioridade no suporte. Nada que use a API (rastreador, planejador, coleção) fica atrás de pagamento. Mesmo assim, "assinar para tirar anúncio" é zona cinzenta nos termos e vale passar pelo jurídico antes de cobrar.

Forma de pagamento (decisão do Bruno): Mercado Pago (aceita CPF, Pix e cartão) ou Stripe (cartão, Pix; normalmente pede CNPJ no Brasil).

## Outras opções sem conflito

- Apoio voluntário (Apoia.se, Ko-fi, Pix) numa página "Apoie", sem bloquear nada.
- Patrocínio da Comunidade BR (criadores, eventos), com transparência.
