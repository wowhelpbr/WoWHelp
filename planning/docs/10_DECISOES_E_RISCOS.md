# 10 | Decisões, riscos e pendências

| ID | Item | Risco | Mitigação ou ação |
| --- | --- | --- | --- |
| D01 | Retail / Midnight primeiro | Cobertura Classic dispersa | Classic como projeto separado |
| D02 | Next.js na Vercel | Custo e dependência de provedor | Monitorar quotas e manter camadas portáveis |
| D03 | Supabase | RLS inadequada expõe dados | Política por dono + teste de isolamento |
| D04 | PWA antes de apps nativos | Limites iOS e acesso a arquivos | Focar checklists mobile, não diretório WoW |
| D05 | Addon sem HTTP | Dados apenas após logout/reload | Upload manual com confirmação |
| D06 | Battle.net vinculado a Supabase Auth | Confusão entre identidade e dados do jogo | Contas separadas e vinculação por OAuth |
| R01 | APIs Blizzard incompletas ou mutáveis | Dashboard sem estados confiáveis | Tri state e plano manual |
| R02 | Addon API de Midnight muda | Campos deixam de funcionar | Versionar compatibilidade e degradar graciosamente |
| R03 | Assets antigos sem licença clara | Violação de propriedade intelectual | Auditoria antes de publicar |
| R04 | Artigos de Shadowlands desatualizados | Informação errada para usuários | Auditoria por expansão e revisão 2026 |
| R05 | Dados de terceiros com restrições | API bloqueada ou uso não autorizado | Usar fonte própria ou link externo |
| R06 | Privacidade e arquivos Lua importados | Dados pessoais e execução maliciosa | Parser não executável e retenção mínima |
| R07 | Escopo muito amplo | MVP nunca concluído | Gate por fase e P2 fora do MVP |
| R08 | Conta Battle.net sem autorização | Usuário não aceita consentimento | Experiência anônima e manual básica |
| R09 | Integrações móveis PWA | Usuário imagina sync automático pelo celular | Descrever limitações e fluxo desktop claramente |

## Pendências que não bloqueiam começar a fundação

* Definir repositório e organização GitHub para WoWHelp, sem reutilizar projetos de outras marcas.
* Confirmar quem provisionará chaves Battle.net, Supabase e Vercel.
* Confirmar permissões editoriais e comerciais dos materiais do Drive.
* Validar detalhes atuais de custom OAuth Supabase versus vinculação de conta Battle.net; decisão padrão é vinculação separada.
* Validar nomes de coleções e endpoints reais na API da Blizzard para a conta de teste.
* Definir limites de orçamento e proprietário de alertas.
* Selecionar grupo de beta e política editorial da base de montarias.

## Regra anti suposições

Cláudio deve registrar todo dado não verificado como `TBD`, mostrar fonte ou teste reprodutível e somente então transformar uma hipótese em requisito implementado. Não fabricar endpoints, horários de reset, permissões de addon, status de coleção ou custos.
