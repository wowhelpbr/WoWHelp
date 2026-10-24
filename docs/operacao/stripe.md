# Stripe: assinatura WoWHelp Apoiador

O que está configurado, onde fica cada coisa e o passo a passo para começar a cobrar de verdade.

## O que a assinatura dá

- Site sem anúncios e selo "Apoiador" no cabeçalho.
- Nada que vem da API da Blizzard fica atrás de pagamento (rastreador, planejador e coleção continuam grátis). Ver [../monetizacao.md](../monetizacao.md).

## O que já existe no Stripe (área de teste)

Conta: **"Área restrita de WoWHelp"** (sandbox, `acct_1UTxwR2QxVb9nLNT`), criada em 24/10/2026. Nada é cobrado.

| Item | Como o site acha | Valor |
| --- | --- | --- |
| Produto "WoWHelp Apoiador" | — | `prod_VUy32VQdHNKbr7` |
| Preço mensal | lookup key `apoiador_mensal` | R$ 9,90 por mês |
| Preço anual | lookup key `apoiador_anual` | R$ 99,00 por ano |
| Portal do cliente (cancelar, trocar cartão, mudar de plano) | configuração padrão | `bpc_1UTy8H2QxVb9nLNTjw4qUTF4` |
| Aviso de pagamento (webhook) | `https://wowhelp.vercel.app/api/stripe/webhook` | `we_1UTy8b2QxVb9nLNTf4onHp1L` |

O webhook avisa: `checkout.session.completed` e `customer.subscription.created/updated/deleted/paused/resumed`. O site sempre relê a assinatura no Stripe, então a ordem dos avisos não importa.

Para mudar o preço: crie um preço novo no mesmo produto e passe o lookup key para ele ("transferir lookup key" no painel). Não precisa mexer no código.

## Variáveis na Vercel (projeto wowhelp, conta wowhelpbrasil)

| Variável | O que é | Quem cadastra |
| --- | --- | --- |
| `STRIPE_SECRET_KEY` | chave secreta (`sk_test_` no teste, `sk_live_` no real) | o Bruno, com `scripts/cadastrar-chave-vercel.ps1 STRIPE_SECRET_KEY` |
| `STRIPE_WEBHOOK_SECRET` | segredo do aviso de pagamento (`whsec_`) | já cadastrado em 24/10/2026 (teste) |

Nunca cole chave no chat nem no git. Depois de cadastrar, faça um novo deploy (ou espere o próximo merge) para valer.

## Na administração do site

**Administração > Assinaturas** mostra se o Stripe está em teste ou real, se o aviso de pagamento e os preços estão certos, quantos apoiadores ativos existem e a lista das últimas assinaturas. Lá fica a chave **"Venda aberta ao público"**:

- Desligada (padrão): só administradores veem os botões de assinar. Serve para testar.
- Ligada: qualquer pessoa logada pode assinar.

Em modo de teste, não abra ao público: qualquer pessoa vira apoiador com o cartão de teste.

## Testar (modo de teste)

1. Entre no site com a sua conta de administrador e abra "Seja apoiador" (rodapé) ou `/pt-br/supporter`.
2. Clique em "Assinar o mensal" ou "Assinar o anual".
3. Na página do Stripe, use o cartão `4242 4242 4242 4242`, qualquer data futura, qualquer código de segurança e qualquer nome.
4. Ao voltar, a página diz "Você é apoiador. Obrigado!", o selo aparece no cabeçalho e os anúncios somem.
5. Em Configurações > Assinatura > "Gerenciar assinatura", dá para cancelar. O selo continua até o fim do período pago.

## Começar a cobrar de verdade

1. **Revisão jurídica** dos termos (seção "Assinatura WoWHelp Apoiador") e da política de privacidade, inclusive se "assinar para tirar anúncio" está dentro dos termos da API da Blizzard.
2. **Ativar a conta real do Stripe** (no painel, "Ativar pagamentos"): dados da empresa (normalmente CNPJ), conta bancária e documento.
3. Na conta real, copiar o produto e os dois preços (mesmos lookup keys `apoiador_mensal` e `apoiador_anual`), configurar o portal do cliente e criar o webhook para o endereço de produção. Eu faço isso pelo Stripe CLI depois que a conta estiver ativa (basta autorizar o CLI na conta real).
4. Trocar `STRIPE_SECRET_KEY` (para `sk_live_`) e `STRIPE_WEBHOOK_SECRET` (o do webhook real) na Vercel, só no ambiente Production.
5. Em Administração > Assinaturas, conferir "Stripe em modo real" e ligar "Venda aberta ao público".

## Quando o domínio mudar para wowhelp.com.br

O webhook aponta para `wowhelp.vercel.app`. Se esse endereço passar a redirecionar para o domínio novo, o Stripe para de entregar os avisos (ele não segue redirecionamento). Atualizar o endereço do webhook para `https://wowhelp.com.br/api/stripe/webhook` no mesmo dia, e também os links de privacidade, termos e retorno do portal.

## Excluir conta e exportar dados

- Ao excluir a conta, o site cancela a assinatura no Stripe na hora. Se o Stripe não responder, a conta não é excluída (senão a cobrança continuaria sem conta).
- "Baixar meus dados" inclui o cadastro no Stripe e a situação da assinatura.

## Onde está no código

- Banco: `supabase/migrations/20261027000100_supporters.sql` (testes em `supabase/tests/database/10_supporters_rls.test.sql`).
- Stripe: `apps/web/src/lib/stripe/client.ts` e `apps/web/src/features/billing/`.
- Aviso de pagamento e volta do pagamento: `apps/web/src/app/api/stripe/`.
- Testes: `apps/web/tests/unit/billing.test.ts`, `apps/web/tests/e2e/supporter.spec.ts` e o Stripe falso em `apps/web/tests/mocks/stripe-mock.mjs`.
