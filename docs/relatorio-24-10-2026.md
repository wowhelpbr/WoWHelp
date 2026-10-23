# Relatório da manhã | 24/10/2026

## Resumo

As 7 fases (0 a 6) estão prontas no código e no ar em **https://wowhelp.vercel.app** (prévia, sem divulgação). O que falta depende de você: testes reais (Battle.net e jogo), revisão jurídica e algumas escolhas.

## O que está no ar

| Fase | O que o jogador faz |
| --- | --- |
| 0 e 1 | Escolhe o que quer fazer hoje, cria conta, monta objetivos com passos |
| 2 | Conecta a Battle.net e vê personagens e montarias da conta |
| 3 | Navega pelas **1686 montarias oficiais** (busca, filtros, coletada / não obtida / desconhecida) e transforma uma em objetivo |
| 4 | Planeja a semana (reset por região) e uma sessão de 15 a 120+ minutos |
| 5 | Baixa o addon **WoWHelp Companion**, importa o arquivo do jogo e vê personagens e coleção |
| 6 | Lê privacidade e termos (rascunho), baixa os próprios dados e exclui a conta |

Teste de fumaça na produção hoje de madrugada: cadastro, objetivo, botão da Battle.net, importação do addon, filtro de montarias, exportar e excluir conta: **tudo ok**. A conta temporária foi apagada no fim; também apaguei as 2 contas de teste da noite. Sua conta (bruno.pansarello@gmail.com) não foi tocada.

Testes automáticos: 111 unitários, 63 de banco, 70 de ponta a ponta (computador e celular), todos passando no GitHub.

## O que precisa de você (em ordem)

1. **Testar a Battle.net:** entre no site com sua conta > Personagens > "Conectar Battle.net" > aprove no site da Blizzard. Seus personagens e montarias devem aparecer.
2. **Testar o addon no jogo:** roteiro de 9 passos em [fase-5/relatorio-fase-5.md](fase-5/relatorio-fase-5.md) ("Roteiro de teste no jogo").
3. **Revisão jurídica e nome:** entregue ao advogado o [checklist legal](fase-6/checklist-legal.md). Inclui a decisão sobre "WoW" no nome.
4. **Backup do banco:** escolha entre Supabase Pro (pago, cópia diária) ou cópia manual semanal ([backup-e-rollback.md](operacao/backup-e-rollback.md)).
5. **E-mail próprio (SMTP)** para ligar a confirmação de cadastro antes de abrir para outras pessoas.
6. **Grupo do alpha:** 3 a 5 pessoas ([plano de beta](fase-6/plano-de-beta.md)).

## Achados da noite

- **Bug corrigido:** o leitor do arquivo do addon recusava arquivos sem o horário do reset semanal (o jogo às vezes não informa). Achado pelos testes antes de chegar a alguém.
- **Bug corrigido:** catálogo e coleção paravam em 1000 itens (limite da API do Supabase).
- **Segurança:** o Supabase criou sozinho uma função que visitantes podiam chamar; tirei a permissão. Resta só um aviso: "proteção contra senha vazada", que é do plano pago.
- 13 montarias não têm nome em português na Blizzard; aparecem em inglês.

## Onde está tudo

- Quadro de tarefas: [a-fazer.md](a-fazer.md)
- Relatórios por fase: pasta `docs/fase-N/`
- Se algo der errado: [resposta-a-incidentes.md](operacao/resposta-a-incidentes.md)
- Teste de fumaça (para repetir depois de mudanças): `node apps/web/scripts/smoke-production.mjs`

## Próxima tarefa sugerida

Testar a Battle.net com a sua conta (passo 1): é o que mais destrava, porque confirma o login oficial e os dados reais da sua coleção.
