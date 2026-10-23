# 07 | Materiais encontrados no Drive e plano de migração

## Inventário verificado em 22/10/2026

| Coleção | Link | Conteúdo visto | Uso proposto |
| --- | --- | --- | --- |
| Pasta WoWhelp | https://drive.google.com/drive/folders/1Rf1jb6vGhbdPrWSXvCGYL372tBQ89hgQ | 23 itens, logos, imagens de classes, fundos e pastas | Inventário visual e estudo de redesign |
| Logo_wowhelp | https://drive.google.com/drive/folders/1TU1X9onU4_SBtrAEMsYRwKB9Tp7QunkZ | EPS branco/preto/colorido e AI | Vetores da marca após confirmação de direitos |
| Documentos WoWHelp | https://drive.google.com/drive/folders/1Ur2RkaSIdI-f3oo_6mg8H15JD29gWg76 | 62 documentos, maioria da era Shadowlands | Base histórica editorial a auditar, não conteúdo atual direto |
| Ilustrações Elianai | https://drive.google.com/drive/folders/18sM0ApRKkYjtIYgewgfitETABhguVucg | 23 itens incluindo imagens de classes e packs | Revisão de direitos e consistência estética |

## Documentos lidos

* **Guia de Montarias para Novatos:** https://docs.google.com/document/d/1dt1CeRJkzms0BgofYSJ__PAAmMt0dCMh/edit . Contém montarias, coordenadas `/way`, pré requisitos e instruções detalhadas; vários marcadores ADD IMG.
* **Guia de Atividades Diárias e Semanais de Shadowlands:** https://docs.google.com/document/d/1lZdW1vRX9v7H_esm7v4--_cNfmDoiYwK/edit . Modelo editorial útil para organizar prioridade semanal, mas mecânicas e números são históricos.
* **Montarias fáceis de pegar em Shadowlands:** https://docs.google.com/document/d/1hjMF4zpeAYmav2ebsB3AqTDN_Ca1C0dv/edit . Guia com localização, ordem de ações, requisitos e referências visuais pendentes.

## Regras de reuso

1. Não mover, alterar, republicar ou compartilhar arquivos originais automaticamente.
2. Confirmar titularidade e condições de licença de imagens, logotipos, fontes e textos. Verificar especificamente contratos de ilustração, quando aplicável, com revisão jurídica.
3. Converter arquivos em staging e manter links e créditos de origem.
4. Classificar cada documento: conteúdo atual e revisado; conteúdo histórico; material incompleto; não publicável.
5. Revisar factualidade em Retail 2026 e preservar etiqueta de expansão para orientações antigas.
6. Transformar guias em registros estruturados com IDs, passos, coordenadas, pré requisitos, revisão e fonte; não depender de raspagem de conteúdo de terceiros.
7. Revisar nomenclatura inglesa e localização pt-BR antes de publicar.

## Processo editorial

`discovered -> rights_review -> content_parse -> fact_check -> localization -> approved -> published`.

## Primeiro lote de conteúdo

Escolher 30 montarias com processos de aquisição verificáveis e preferência por conteúdo atemporal. Catalogar fontes oficiais e verificar cada requisito no cliente atual. Itens com eventos temporários, drops alterados ou condições incertas ficam fora do primeiro lote até confirmação.

## Estrutura sugerida

`content_guides` contém metadados e editor; `content_guide_steps` contém passos; `content_translations` contém idioma e revisão; `source_references` contém fonte, direitos e data de auditoria.

Não importar arquivos para Supabase Storage público antes de aprovar os direitos de uso e optimização de imagem.
