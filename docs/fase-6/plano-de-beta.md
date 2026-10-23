# Plano de beta

Base: planning/docs/09 ("Beta gradual"). Nada disso começa sem o Bruno: o grupo de beta, os convites e a divulgação são decisão dele.

## Antes de convidar alguém

- [ ] Revisão jurídica e decisão sobre o nome ([checklist-legal.md](checklist-legal.md)).
- [ ] SMTP próprio (ex.: Resend) e confirmação de e-mail ligada.
- [ ] Cópia de segurança do banco (Supabase Pro ou cópia manual, ver [backup-e-rollback.md](../operacao/backup-e-rollback.md)).
- [ ] Teste real da Battle.net e do addon no jogo pelo Bruno.

## Etapa 1: alpha interno (3 a 5 contas)

Pessoas próximas, cada uma com um perfil: colecionador de montarias, jogador de semanais, quem tem muitos alts, jogador casual com pouco tempo, jogador novo.

Tarefas pedidas a cada um (uma sessão de 20 minutos):

1. Criar conta e escolher o que quer fazer.
2. Conectar a Battle.net **ou** importar o addon.
3. Achar uma montaria que não tem e transformar em objetivo.
4. Montar uma sessão de 30 minutos no planejador.
5. Dizer, no fim: "o que você faria agora no jogo?" (métrica norte: saber a próxima atividade útil sem abrir outra ferramenta).

## Etapa 2: beta fechado (20 a 50 jogadores)

- Convite por link, com prazo de 2 a 3 semanas.
- Formulário curto ao fim de cada semana: o que usou, o que travou, o que faltou, nota de 0 a 10.
- Acompanhar nos logs da Vercel: `battlenet_link_failed`, `addon_import_failed`, `objective_created`.

## Etapa 3: abrir

Só depois de corrigir os problemas da etapa 2 e de revisar o que mais travou.
