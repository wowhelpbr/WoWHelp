# Checklist legal (para a revisão jurídica)

Os textos estão no site como **rascunho** ([/pt-br/privacy](https://wowhelp.vercel.app/pt-br/privacy) e [/pt-br/terms](https://wowhelp.vercel.app/pt-br/terms)) e no código em `apps/web/src/features/legal/content.ts`. Eles descrevem o que o sistema faz hoje. Itens para o profissional decidir ou validar:

## Decisões que faltam (o site mostra "a definir")

- [ ] **Controlador dos dados:** pessoa física ou empresa (nome/CNPJ) que responde pelo WoWHelp.
- [ ] **Encarregado (DPO) e canal de contato:** e-mail próprio do WoWHelp para pedidos de titulares.
- [ ] **Idade mínima** e regras para adolescentes (LGPD art. 14). A Blizzard tem regras próprias de idade para a Battle.net.
- [ ] **Lei aplicável, foro e limites de responsabilidade** nos termos, respeitando o Código de Defesa do Consumidor.
- [ ] **Nome e marca:** "WoWHelp" usa "WoW", marca da Blizzard. Avaliar risco e, se for o caso, nome alternativo antes de divulgar (vale também para publicar o addon no CurseForge/Wago).

## Validar

- [ ] Bases legais escolhidas: execução do serviço (conta, objetivos, planejador), consentimento (Battle.net e addon), legítimo interesse (segurança e limites).
- [ ] Transferência internacional (art. 33): banco nos EUA (Supabase, Oregon) e hospedagem global (Vercel). Qual hipótese do art. 33 usar.
- [ ] Retenção: Battle.net 30 dias (exigência dos termos da API da Blizzard); demais dados até o jogador apagar. Cópias de segurança do provedor.
- [ ] Prazo e forma de comunicar incidentes (art. 48 e Resolução CD/ANPD nº 15/2024), ver `docs/operacao/resposta-a-incidentes.md`.
- [ ] Termos da API da Blizzard (Blizzard Developer API Terms of Use): crédito, cache de no máximo 30 dias e o que é permitido em uso comercial (anúncios, assinatura). Hoje o WoWHelp é gratuito e sem anúncios.
- [ ] Contrato das ilustrações (Elianai dos Santos): cessão cobre site, app e addon, inclusive uso comercial futuro.
- [ ] Aviso de não afiliação com a Blizzard (rodapé de todas as páginas).
- [ ] Assinatura WoWHelp Apoiador (Stripe): seção nos termos (renovação, cancelamento, arrependimento de 7 dias do CDC art. 49, mudança de preço), Stripe como operador na política de privacidade, nota fiscal/tributação da receita e se "assinar para tirar anúncio" cabe nos termos da API da Blizzard. Detalhes em docs/operacao/stripe.md.

## Já implementado (pode testar)

| Direito do titular (art. 18) | Como o jogador faz |
| --- | --- |
| Acesso e portabilidade | Configurações > Baixar meus dados (JSON com todas as tabelas da conta) |
| Correção | Edita no próprio site |
| Eliminação | Configurações > Excluir conta (apaga tudo na hora; testado de ponta a ponta) |
| Revogar consentimento | Personagens > Desconectar (Battle.net) e Importar addon > Apagar dados do addon |
| Informação sobre compartilhamento | Página de privacidade, seção "Com quem os dados são tratados" |

Sem cookies de analytics ou publicidade, por isso não há banner de cookies (só cookies necessários: sessão e idioma). Se um dia entrar analytics, precisa de banner e consentimento.
