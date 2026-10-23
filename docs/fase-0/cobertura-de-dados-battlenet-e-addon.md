# Cobertura de dados: Battle.net (OAuth e Web API) e API de addons (Midnight 12.x)

Fase 0 do WoWHelp. Pesquisa técnica para decidir as Fases 2 (login e dados Battle.net) e 5 (addon Lua).
Todas as fontes foram consultadas em **23/10/2026**.

## Como a pesquisa foi feita

- `develop.battle.net` hoje redireciona (HTTP 301) para `community.developer.battle.net`. O portal é montado por JavaScript, mas o próprio site busca o texto em arquivos JSON no endereço `https://community.developer.battle.net/api/pages/content/<caminho-da-página>.json`. Li esses arquivos: o texto é o mesmo que o site mostra. Nas tabelas, cito a URL legível da página. O JSON fica no mesmo caminho, com o prefixo `/api/pages/content/` e o sufixo `.json`.
- Não criei conta, não registrei aplicação e não fiz requisição autenticada. As únicas chamadas diretas a servidores da Blizzard foram públicas e sem credencial:
  - o documento de descoberta OpenID (`https://oauth.battle.net/.well-known/openid-configuration`);
  - o servidor público de versões do cliente (`https://us.version.battle.net/v2/products/wow/versions`).
- Para a API Lua usei:
  - a documentação que a própria Blizzard gera e distribui dentro do cliente (pasta `Blizzard_APIDocumentationGenerated`), lida no espelho público `Gethe/wow-ui-source`, ramo `live`. Esse ramo está na build **12.1.5.70529**, a mesma que o servidor oficial de versões informa como ao vivo;
  - a lista de funções e eventos globais extraída do cliente (`Ketho/BlizzardInterfaceResources`, ramo `live`, build 12.1.5.70448);
  - o warcraft.wiki.gg.
- No fórum oficial, só conto como fonte oficial os posts de contas marcadas "Blizzard Developer" (equipe da Blizzard). Posts de usuários ou "MVP" aparecem como evidência, sempre com status TBD.
- Status usados: **Confirmado** (fonte oficial ou documentação gerada pela Blizzard; para a API Lua também vale o wiki), **TBD** (não verificado, com o motivo).

---

## Resumo executivo

### O que está confirmado

1. **Endereços OAuth:** `https://oauth.battle.net/authorize` e `https://oauth.battle.net/token` valem para US, EU e APAC. APAC substitui as antigas regiões KR e TW. China usa `oauth.battlenet.com.cn`. O userinfo fica em `https://oauth.battle.net/userinfo` e existe `/check_token`. O documento de descoberta lista ainda `https://oauth.battle.net/revoke`, que não aparece na documentação do portal.
2. **Fluxos:** Authorization Code e Client Credentials. O parâmetro `state` é documentado e recomendado contra CSRF.
3. **Validade do token:** o access token dura **24 h** (`expires_in` 86399). Ele vai sempre no cabeçalho `Authorization: Bearer`; passar na URL deixou de funcionar em 30/09/2024.
4. **Escopos:** `openid`, `wow.profile`, `sc2.profile` e `d3.profile`. Sem nenhum escopo, o app recebe só o ID da conta e a BattleTag. O `wow.profile` libera os personagens de WoW da conta e as coleções da conta: montarias, mascotes, brinquedos, heranças, transmog e **decoração de casa**.
5. **Profile API:**
   - `/profile/user/wow` e `/profile/user/wow/collections/{mounts|pets|toys|heirlooms|transmogs|decor}` exigem login do usuário (Authorization Code com `wow.profile`).
   - Os mesmos dados por personagem (`/profile/wow/character/{realmSlug}/{characterName}/collections/...`), conquistas e casa funcionam com Client Credentials.
6. **Game Data API:** `/data/wow/mount/index`, `/data/wow/mount/{id}`, busca de montarias, mídia de `creature-display` e catálogo de decoração (`/data/wow/decor/...`) funcionam com Client Credentials, ou seja, não exigem login do usuário.
7. **Namespaces e idioma:** os namespaces são `static-us`, `dynamic-us` e `profile-us`. O host `us.api.blizzard.com` aceita `en_US`, `es_MX` e **`pt_BR`**.
8. **Limites de requisição:** 36.000 por hora e 100 por segundo. Passar do limite por segundo dá **429**; passar do limite por hora deixa o serviço mais lento e, pelos Termos, pode levar a suspensão.
9. **Termos de uso da API:**
   - dados guardados por **no máximo 30 dias**;
   - **proibida versão "premium" paga**, cobrança por acesso e anúncio em vídeo obrigatório;
   - proibido usar os dados em publicidade;
   - é obrigatório citar a Blizzard como fonte;
   - **nenhuma marca da Blizzard no título nem na URL** do app;
   - política de privacidade obrigatória;
   - público a partir de 13 anos.
10. **Supabase:** Battle.net **não** é provedor nativo do Supabase Auth. Dá para ligar como "Custom OAuth/OIDC Provider": até 3 provedores no plano Free, PKCE ligado por padrão e e-mail obrigatório por padrão (desligável com `email_optional`).
11. **Versão do jogo:** o cliente ao vivo é **12.1.5** (build 70529) e o PTR é 12.1.7. O valor de `## Interface` para o 12.1.5 é **120105**. Addons com interface menor que 120000 não carregam no Midnight.
12. **Montarias no addon:** `C_MountJournal.GetMountIDs` e `GetMountInfoByID` (que traz `isCollected`) existem na build 12.1.5. Nenhum retorno delas é marcado como "secreto".
13. **Identificação no addon:** `UnitGUID`, `GetRealmName`, `GetNormalizedRealmName`, `GetCurrentRegion`, `GetCurrentRegionName` e `GetBuildInfo` existem, assim como os eventos `ADDON_LOADED`, `PLAYER_LOGIN` e `PLAYER_LOGOUT`.
14. **SavedVariables:**
   - são arquivos Lua em `_retail_\WTF\Account\<CONTA>\SavedVariables\<Addon>.lua` (há também a versão por personagem);
   - são gravados ao sair, desconectar, fechar o jogo ou dar `/reload`;
   - não podem conter valores secretos.
15. **Catálogo de decoração no addon:** `C_HousingCatalog` existe e tem funções de leitura (catálogo, quantidade guardada e quantidade colocada). Só as ações de carrinho e loja são restritas.

### O que é TBD (não verificado)

- **PKCE no host global:** não está documentado, e o documento de descoberta global não anuncia (o da China anuncia S256).
- **Refresh token:** a documentação não fala nisso. O documento de descoberta lista o tipo `refresh_token`, mas a resposta de exemplo da troca de código não traz esse campo.
- **Revogação (`/revoke`):** existe no metadado, mas o comportamento não está documentado.
- **Respostas do `/userinfo`:** a documentação diz "ID da conta e BattleTag", mas não mostra os nomes dos campos. Não há escopo de e-mail documentado.
- **Formato das respostas:** o portal lista caminhos e parâmetros, mas **não publica o formato das respostas**. Para `/data/wow/mount/{id}`, a Blizzard confirmou só `faction` e `should_exclude_if_uncollected`; os demais campos aparecem apenas em exemplos de usuários de 2020. O mesmo vale para `/profile/user/wow` e para as coleções da conta.
- **Endpoint da casa:** a documentação usa `/house/house-{houseNumber}` e o anúncio usa `/house/{houseId}`. Não sei qual vale.
- **Opção de privacidade** "Share my game data with community developers": o artigo de suporte exige login.
- **Nome "WoWHelp":** é uma questão jurídica. "WoW" não aparece na lista oficial de marcas, mas os Termos proíbem marca da Blizzard no título e na URL.
- **Supabase com Battle.net:** falta saber como o Supabase mapeia os campos (ID, BattleTag) e se o nonce e o PKCE funcionam na prática.
- **Montarias e catálogo de decoração em combate ou instância:** o comportamento real no jogo não foi testado. A documentação não marca restrição.
- **Sintaxe exata do arquivo SavedVariables:** a fonte diz só "Lua puro".
- **Número de interface em fonte da própria Blizzard:** não achei página oficial; o valor vem do wiki, cruzado com a versão oficial.

### O que bloqueia

- **Fase 2 (login Battle.net e coleção da conta):** nada impede escrever o código. Para ligar em produção falta:
  - um cliente registrado no portal (feito pelo Bruno, com autenticador e aceite dos Termos);
  - um teste real que feche os TBD de PKCE, refresh token, campos do userinfo, e-mail e formato das coleções.
- **Decisões de produto e jurídicas, antes de publicar:**
  - nada pago pode depender da API;
  - avaliar o nome "WoWHelp" diante da regra de marca no título e na URL;
  - política de privacidade;
  - limpeza dos dados a cada 30 dias.
- **Fase 5 (addon):** nada bloqueia tecnicamente. Falta testar no cliente.

---

## Seção A: Battle.net OAuth e Web API

### A1. Endereços de authorize, token, userinfo e revoke por região

| Afirmação | Status | Fonte (URL) | Data de consulta |
|---|---|---|---|
| `develop.battle.net` redireciona (301) para `community.developer.battle.net`. | Confirmado | https://develop.battle.net/documentation/guides/using-oauth | 23/10/2026 |
| Authorize para US, EU e APAC: `https://oauth.battle.net/authorize`. Token: `https://oauth.battle.net/token`. | Confirmado | https://community.developer.battle.net/documentation/guides/using-oauth | 23/10/2026 |
| China: `https://oauth.battlenet.com.cn/authorize` e `https://oauth.battlenet.com.cn/token`. | Confirmado | https://community.developer.battle.net/documentation/guides/using-oauth | 23/10/2026 |
| A documentação diz que "APAC" substitui as regiões antigas `kr` e `tw`. Para todas as regiões, exceto China, o host OAuth é `oauth.battle.net`, que funciona como host global. | Confirmado | https://community.developer.battle.net/documentation/guides/using-oauth ; https://community.developer.battle.net/documentation/battle-net/oauth-apis | 23/10/2026 |
| Hosts OAuth regionais antigos (`https://{região}.battle.net/oauth/...`) | TBD: não constam da documentação atual. Aparecem só em posts antigos de usuários e não foram testados. | (nenhuma fonte oficial atual) | 23/10/2026 |
| Userinfo: `https://oauth.battle.net/userinfo`, sempre no host `oauth.battle.net`, com o token no cabeçalho. | Confirmado | https://community.developer.battle.net/documentation/guides/using-oauth/authorization-code-flow | 23/10/2026 |
| Validação de token: `/check_token` em todas as regiões (GET `?token=` ou POST; a Blizzard recomenda POST). Retorna `client_id`, expiração e escopos. A descoberta OIDC lista `introspection_endpoint: https://oauth.battle.net/v2/check_token`. | Confirmado | https://community.developer.battle.net/documentation/battle-net/oauth-apis ; https://oauth.battle.net/.well-known/openid-configuration | 23/10/2026 |
| Revogação: o documento de descoberta global lista `revocation_endpoint: https://oauth.battle.net/revoke`. A documentação do portal não cita esse endpoint. | Confirmado (existe no metadado). Uso e comportamento: TBD, por falta de documentação e de teste. | https://oauth.battle.net/.well-known/openid-configuration | 23/10/2026 |
| A descoberta global também lista `issuer: https://oauth.battle.net`, `jwks_uri: https://oauth.battle.net/jwks/certs`, `end_session_endpoint: https://oauth.battle.net/logout` e `device_authorization_endpoint`. | Confirmado | https://oauth.battle.net/.well-known/openid-configuration | 23/10/2026 |
| Hosts da Web API: `https://us.api.blizzard.com`, `eu.`, `kr.` e `tw.`. China usa `https://gateway.battlenet.com.cn`. | Confirmado | https://community.developer.battle.net/documentation/guides/regionality-and-apis | 23/10/2026 |
| Não há OpenAPI ou repositório oficial com o formato das respostas. A referência do portal (JSON) traz só caminho, método, descrição e parâmetros de cada endpoint. | Confirmado (verifiquei os campos do JSON da referência) | https://community.developer.battle.net/documentation/world-of-warcraft/game-data-apis | 23/10/2026 |

### A2. Fluxos, PKCE, `state` e revogação

| Afirmação | Status | Fonte (URL) | Data de consulta |
|---|---|---|---|
| Authorization Code Flow é suportado. A autorização usa `response_type=code`, `client_id`, `scope`, `state` e `redirect_uri`. A troca usa POST no token com `grant_type=authorization_code`, `code` e `redirect_uri`, autenticado por HTTP Basic (`client_id:client_secret`). | Confirmado | https://community.developer.battle.net/documentation/guides/using-oauth/authorization-code-flow | 23/10/2026 |
| Client Credentials Flow é suportado: POST no token com `grant_type=client_credentials` e HTTP Basic. | Confirmado | https://community.developer.battle.net/documentation/guides/using-oauth/client-credentials-flow | 23/10/2026 |
| `state` é documentado como valor opaco devolvido no redirect, e a Blizzard diz que "should be used for preventing cross-site request forgery". | Confirmado | https://community.developer.battle.net/documentation/battle-net/oauth-apis | 23/10/2026 |
| O `redirect_uri` precisa ser HTTPS e igual a um dos cadastrados no portal (em teste pode ser `https://localhost`). O portal não valida o que é digitado. | Confirmado | https://community.developer.battle.net/documentation/guides/using-oauth ; https://community.developer.battle.net/documentation/battle-net/oauth-apis | 23/10/2026 |
| A descoberta global lista os tipos de concessão `authorization_code`, `client_credentials`, `implicit`, `device_code`, `refresh_token`, `token-exchange` e outros. Isso não garante que todos estejam liberados para clientes do portal comunitário. | Confirmado (metadado) | https://oauth.battle.net/.well-known/openid-configuration | 23/10/2026 |
| PKCE | TBD: o portal não menciona. A descoberta **global** não tem `code_challenge_methods_supported`; a da **China** tem `["S256"]`. Em 2024, um usuário pediu PKCE no fórum e a Blizzard não respondeu. Só um teste real mostra se o host global aceita, ignora ou rejeita `code_challenge`. | https://oauth.battle.net/.well-known/openid-configuration ; https://oauth.battlenet.com.cn/.well-known/openid-configuration ; https://us.forums.blizzard.com/en/blizzard/t/hardening-oauth-20-flows-for-public-clients-with-pkce/52377 | 23/10/2026 |
| A troca do código usa o segredo do cliente, então o fluxo documentado pressupõe um servidor (cliente confidencial). Os Termos exigem manter a chave em sigilo. | Confirmado | https://community.developer.battle.net/documentation/guides/using-oauth/authorization-code-flow ; https://www.blizzard.com/en-us/legal/a2989b50-5f16-43b1-abec-2ae17cc09dd6/blizzard-developer-api-terms-of-use | 23/10/2026 |

### A3. Escopos

| Afirmação | Status | Fonte (URL) | Data de consulta |
|---|---|---|---|
| Escopos documentados: `wow.profile` ("Access to a user's World of Warcraft characters"), `sc2.profile`, `d3.profile` e `openid` (dados do usuário logado via OIDC, em `/userinfo`). | Confirmado | https://community.developer.battle.net/documentation/guides/using-oauth | 23/10/2026 |
| Sem escopo nenhum, o app recebe só o ID da conta e a BattleTag. | Confirmado | https://community.developer.battle.net/documentation/guides/using-oauth | 23/10/2026 |
| O usuário pode recusar escopos individualmente; a lista devolvida pode ter menos escopos que a pedida. | Confirmado | https://community.developer.battle.net/documentation/guides/using-oauth/authorization-code-flow | 23/10/2026 |
| O `wow.profile`, obtido por Authorization Code, libera `/profile/user/wow`, `/profile/user/wow/protected-character/{realmId}-{characterId}`, `/profile/user/wow/collections` e `/collections/{decor, heirlooms, mounts, pets, toys, transmogs}`. A lista do guia "Using OAuth" está desatualizada (cita só collections, pets e mounts); a referência da Profile API marca os seis tipos. | Confirmado | https://community.developer.battle.net/documentation/world-of-warcraft/profile-apis | 23/10/2026 |
| `/userinfo` retorna "o ID da conta e a BattleTag". | Confirmado | https://community.developer.battle.net/documentation/guides/using-oauth/authorization-code-flow | 23/10/2026 |
| Nomes exatos dos campos do `/userinfo` (ex.: `sub`, `id`, `battletag`) e conteúdo do `id_token` | TBD: a documentação não mostra exemplo de resposta. Precisa de chamada autenticada. | https://community.developer.battle.net/documentation/guides/using-oauth/authorization-code-flow | 23/10/2026 |
| E-mail do usuário | TBD: nenhum escopo nem campo de e-mail é documentado. É provável que não venha, mas isso só se confirma com teste. | https://community.developer.battle.net/documentation/guides/using-oauth | 23/10/2026 |

### A4. Validade do token e refresh token

| Afirmação | Status | Fonte (URL) | Data de consulta |
|---|---|---|---|
| Access tokens duram 24 horas (o exemplo traz `"expires_in": 86399`). | Confirmado | https://community.developer.battle.net/documentation/guides/using-oauth ; https://community.developer.battle.net/documentation/guides/using-oauth/authorization-code-flow | 23/10/2026 |
| O token expira antes se o usuário trocar a senha, remover a autorização do app ou tiver a conta bloqueada. A Blizzard orienta conferir a resposta e pedir token novo quando falhar. | Confirmado | https://community.developer.battle.net/documentation/guides/using-oauth | 23/10/2026 |
| O token vai no cabeçalho `Authorization: Bearer`. "Providing the token in the URL via a query string parameter will no longer be supported from September 30, 2024." (O guia antigo de Game Data ainda cita `access_token` na URL; vale o cabeçalho.) | Confirmado | https://community.developer.battle.net/documentation/guides/using-oauth/authorization-code-flow ; https://community.developer.battle.net/documentation/guides/game-data-apis | 23/10/2026 |
| Refresh token | TBD: a documentação não fala nisso, e a resposta de exemplo da troca de código não tem `refresh_token`. A descoberta lista o tipo `refresh_token`. Em 2019, um MVP (não é equipe da Blizzard) escreveu que não havia refresh token e que o login único (SSO) da Battle.net dura cerca de 30 dias. Precisa de teste real. | https://community.developer.battle.net/documentation/guides/using-oauth/authorization-code-flow ; https://oauth.battle.net/.well-known/openid-configuration ; https://us.forums.blizzard.com/en/blizzard/t/oauth-api-refresh-token/559 | 23/10/2026 |

### A5. Profile API do WoW (conta e personagem), namespaces e `locale`

| Afirmação | Status | Fonte (URL) | Data de consulta |
|---|---|---|---|
| Conta, exigindo Authorization Code com `wow.profile`: `GET /profile/user/wow` (resumo do perfil da conta), `/profile/user/wow/protected-character/{realmId}-{characterId}`, `/profile/user/wow/collections` (índice), `/collections/mounts`, `/collections/pets`, `/collections/toys`, `/collections/heirlooms`, `/collections/transmogs` e `/collections/decor`. Namespace `profile-us`. | Confirmado | https://community.developer.battle.net/documentation/world-of-warcraft/profile-apis | 23/10/2026 |
| Personagem, com Client Credentials (fora da lista de exceções): `/profile/wow/character/{realmSlug}/{characterName}` e `.../collections`, `.../collections/{mounts, pets, toys, heirlooms, transmogs, decor}`, `.../achievements`, `.../achievements/statistics`, `.../equipment`, `.../reputations`, `.../quests/completed`, `.../titles`, `.../character-media`, `.../status`, `.../mythic-keystone-profile`, `.../house/house-{houseNumber}` e outros. | Confirmado | https://community.developer.battle.net/documentation/world-of-warcraft/profile-apis ; https://community.developer.battle.net/documentation/guides/using-oauth | 23/10/2026 |
| As APIs de habitação (decor, fixture, room, neighborhood, coleção de decor da conta e do personagem, casa do personagem) foram anunciadas por um Blizzard Developer em 19/12/2025 para o 11.2.7, ativas em servidores Retail. | Confirmado | https://us.forums.blizzard.com/en/blizzard/t/new-housing-apis/56815 | 23/10/2026 |
| Caminho do endpoint da casa: a documentação diz `/house/house-{houseNumber}` e o anúncio diz `/house/{houseId}`. | TBD: as fontes oficiais divergem. Precisa de teste. | https://community.developer.battle.net/documentation/world-of-warcraft/profile-apis ; https://us.forums.blizzard.com/en/blizzard/t/new-housing-apis/56815 | 23/10/2026 |
| As coleções de transmog (conta e personagem) foram anunciadas por um Blizzard Developer em 05/08/2024. | Confirmado | https://us.forums.blizzard.com/en/blizzard/t/item-appearance-and-transmog-apis/51532 | 23/10/2026 |
| A coleção de montarias **por personagem** reflete o que o jogador vê no diário dentro do jogo (filtros "Collected" e "Unusable"), com `is_useable` e `is_character_specific`. Para a visão completa da conta, a Blizzard recomenda o endpoint de **conta**, via OAuth (Blizzard Developer, 2020). | Confirmado | https://us.forums.blizzard.com/en/blizzard/t/bug-many-opposing-faction-mounts-missing-from-api/11019 | 23/10/2026 |
| Os dados de personagem são atualizados quando o personagem faz logout. | Confirmado | https://community.developer.battle.net/documentation/world-of-warcraft/guides/namespaces ; https://us.forums.blizzard.com/en/blizzard/t/wow-game-data-and-profile-api-patch-notes-2019-12-10/2392 | 23/10/2026 |
| Namespaces: `static-{região}`, `dynamic-{região}` e `profile-{região}` (ex.: `static-us`, `dynamic-us`, `profile-us`). São obrigatórios em toda requisição, por cabeçalho `Battlenet-Namespace` ou por `?namespace=`. | Confirmado | https://community.developer.battle.net/documentation/world-of-warcraft/guides/namespaces | 23/10/2026 |
| `locale` vai por parâmetro (`?locale=pt_BR`). Sem ele, os campos traduzidos vêm com todos os idiomas; com ele, vem só o idioma pedido. | Confirmado | https://community.developer.battle.net/documentation/world-of-warcraft/guides/localization | 23/10/2026 |
| Formato das respostas de `/profile/user/wow` e das coleções da conta (campos, paginação) | TBD: o portal não publica o formato e eu não fiz chamada autenticada. | https://community.developer.battle.net/documentation/world-of-warcraft/profile-apis | 23/10/2026 |
| Links para documentos internos ainda não publicados ou privados podem retornar 404, 401 ou outro erro. | Confirmado | https://community.developer.battle.net/documentation/world-of-warcraft/guides/known-issues | 23/10/2026 |
| Opção de privacidade da conta ("Game Data and Profile Privacy" / "Share my game data with community developers") pode bloquear dados de personagem para terceiros. | TBD: o artigo oficial de suporte exige login para ler. O texto só apareceu em resumo de busca e em posts de usuários. | https://us.support.blizzard.com/en/article/375447 | 23/10/2026 |

### A6. Game Data API (montarias, mídia, decoração)

| Afirmação | Status | Fonte (URL) | Data de consulta |
|---|---|---|---|
| `GET /data/wow/mount/index`, `GET /data/wow/mount/{mountId}` e `GET /data/wow/search/mount`, com namespace `static-us`. | Confirmado | https://community.developer.battle.net/documentation/world-of-warcraft/game-data-apis | 23/10/2026 |
| `GET /data/wow/media/creature-display/{creatureDisplayId}` (mídia de modelo de criatura), além de `/data/wow/creature/{id}` e da busca de criaturas. | Confirmado | https://community.developer.battle.net/documentation/world-of-warcraft/game-data-apis | 23/10/2026 |
| As montarias (e toda a Game Data API) funcionam com token de **Client Credentials**: "Most API requests require an access token obtained via the OAuth client credentials flow", e montarias não estão na lista de exceções. Mesmo assim, **é preciso um token**, ou seja, um cliente registrado. | Confirmado | https://community.developer.battle.net/documentation/guides/using-oauth ; https://community.developer.battle.net/documentation/guides/game-data-apis | 23/10/2026 |
| `/data/wow/mount/{id}` traz `faction` quando a montaria é de uma facção. Muitas montarias antigas não têm `faction` e trazem `should_exclude_if_uncollected` (a interface do jogo só mostra se o jogador tiver a montaria). | Confirmado (Blizzard Developer, 12/2019) | https://us.forums.blizzard.com/en/blizzard/t/wow-game-data-and-profile-api-patch-notes-2019-12-10/2392 | 23/10/2026 |
| Demais campos de `/data/wow/mount/{id}`: `id`, `name`, `creature_displays[]` (com link para mídia), `description`, `source {type, name}` (ex.: `VENDOR`), `faction` e `requirements` (ex.: `requirements.faction`). Sem item, magia nem ícone. | TBD: aparecem só em exemplos postados por usuários em 2020. Confirmar com chamada real. | https://us.forums.blizzard.com/en/blizzard/t/is-there-any-way-to-get-a-mounts-item-id-using-the-new-api/5598 ; https://us.forums.blizzard.com/en/blizzard/t/not-possible-to-get-reputation-and-cost-required-to-get-a-wow-mount/13988 | 23/10/2026 |
| Os documentos de mídia apontam para imagens (ex.: `render-us.worldofwarcraft.com`). A Blizzard "strongly encourage[s]" guardar cópias dessas imagens no próprio servidor, em vez de linkar direto. | Confirmado | https://community.developer.battle.net/documentation/world-of-warcraft/guides/media-documents | 23/10/2026 |
| Catálogo de habitação: `/data/wow/decor/index`, `/data/wow/decor/{decorId}`, `/data/wow/search/decor`, mais `fixture`, `fixture-hook`, `room` e `neighborhood-map` (este em `dynamic-us`). | Confirmado | https://community.developer.battle.net/documentation/world-of-warcraft/game-data-apis ; https://us.forums.blizzard.com/en/blizzard/t/new-housing-apis/56815 | 23/10/2026 |
| Também há índices e detalhes de mascotes (`/data/wow/pet/...`), brinquedos (`/data/wow/toy/...`), heranças (`/data/wow/heirloom/...`) e aparências (`/data/wow/item-appearance/...`). | Confirmado | https://community.developer.battle.net/documentation/world-of-warcraft/game-data-apis | 23/10/2026 |
| Os dados estáticos (`/data/wow/**`) são atualizados por volta do reset semanal. | Confirmado (Blizzard Developer, 2019) | https://us.forums.blizzard.com/en/blizzard/t/wow-game-data-and-profile-api-patch-notes-2019-12-10/2392 | 23/10/2026 |

### A7. Limites de requisição

| Afirmação | Status | Fonte (URL) | Data de consulta |
|---|---|---|---|
| Cada cliente da API pode fazer 36.000 requisições por hora, a até 100 por segundo. | Confirmado | https://community.developer.battle.net/documentation/guides/getting-started | 23/10/2026 |
| Passar do limite por segundo dá erro **429** até o fim daquele segundo. Passar da cota por hora deixa o serviço mais lento até o tráfego cair. | Confirmado | https://community.developer.battle.net/documentation/guides/getting-started | 23/10/2026 |
| Termos: limite de 36.000 chamadas por hora "or such other limitation as Blizzard may deem appropriate". Exceder ou degradar o serviço pode levar a suspensão ou encerramento do acesso. É proibido usar serviços de terceiros para fazer requisições extras. | Confirmado | https://www.blizzard.com/en-us/legal/a2989b50-5f16-43b1-abec-2ae17cc09dd6/blizzard-developer-api-terms-of-use | 23/10/2026 |
| Cabeçalhos de cota restante ou `Retry-After` | TBD: não são documentados. Precisa de teste. | https://community.developer.battle.net/documentation/guides/getting-started | 23/10/2026 |
| Cada desenvolvedor pode ter até 50 clientes. Usar a API exige autenticador (2FA) na conta Battle.net e aceite dos Termos. | Confirmado | https://community.developer.battle.net/documentation/guides/getting-started | 23/10/2026 |

### A8. Termos de uso da API (Blizzard Developer API Terms of Use, última atualização em 1º/10/2019)

Link: https://www.blizzard.com/en-us/legal/a2989b50-5f16-43b1-abec-2ae17cc09dd6/blizzard-developer-api-terms-of-use

| Afirmação | Status | Fonte (URL) | Data de consulta |
|---|---|---|---|
| A licença permite distribuir os dados a usuários finais **para uso pessoal**, por meio de aplicações **registradas** com a Blizzard. Hoje é gratuita, mas a Blizzard pode cobrar no futuro. | Confirmado | (link dos Termos acima) | 23/10/2026 |
| **Proibido:** versão "Premium" com recursos pagos; cobrar para baixar ou acessar o app, ou por serviços ligados a ele, quando os recursos usam a API; tela de pedido de doação antes de liberar recurso; exigir que o usuário assista a anúncio em vídeo antes de um recurso. | Confirmado | (link dos Termos acima) | 23/10/2026 |
| Proibido usar a API ou os dados para marketing, exibir os dados em publicidade, usar os dados para direcionar anúncios, ou vender, licenciar ou transferir os dados (inclusive agregados ou anônimos). Também é proibido integrá-los a produto físico. | Confirmado | (link dos Termos acima) | 23/10/2026 |
| **Guarda de dados:** "You must implement a maximum 30-day TTL". Nenhum dado obtido pela API pode ficar guardado mais de 30 dias. No WoW, dá para renovar validando pela API se o ID do personagem ainda existe; se não existir, é preciso apagar o personagem e parar de exibi-lo. | Confirmado | (link dos Termos acima) | 23/10/2026 |
| Se um usuário pedir (direto, via Blizzard ou desvinculando a conta), é preciso parar de usar e apagar todos os dados dele. | Confirmado | (link dos Termos acima) | 23/10/2026 |
| É obrigatório identificar a Blizzard como fonte dos dados de forma clara, sem dar a entender endosso ou afiliação. **A aplicação não pode ter marcas da Blizzard no título nem na URL.** | Confirmado | (link dos Termos acima) | 23/10/2026 |
| Política de privacidade obrigatória e coerente com a da Blizzard. É proibido coletar a senha Blizzard do jogador. Em caso de vazamento, avisar a Blizzard em até 24 h. | Confirmado | (link dos Termos acima) | 23/10/2026 |
| A aplicação não pode ser feita nem divulgada para menores de 13 anos, e o conteúdo deve ser adequado à classificação "T for Teen". | Confirmado | (link dos Termos acima) | 23/10/2026 |
| A chave da API (client ID e secret) deve ficar em sigilo. O desenvolvedor responde por todo uso dela. | Confirmado | (link dos Termos acima) | 23/10/2026 |
| A aplicação deve beneficiar a comunidade de jogadores. O desenvolvedor atua como "Service Provider" sob a CCPA e precisa cumprir a GDPR e as demais leis aplicáveis. | Confirmado | (link dos Termos acima) | 23/10/2026 |
| As diretrizes de marca da Blizzard permitem usar as marcas só em atividades previstas nas políticas de conteúdo de usuário (ex.: fan site), e em geral **sem fins comerciais**. Também proíbem usar marca da Blizzard no domínio do site. "World of Warcraft" e "Warcraft" estão na lista de marcas; **"WoW" não aparece** na lista. | Confirmado (texto) | https://www.blizzard.com/en-us/legal/38fd0408-8431-469a-99bc-2cd9eb9462c8/blizzard-entertainment-trademark-usage-guidelines | 23/10/2026 |
| O nome e o domínio "WoWHelp" são compatíveis com a regra "sem marca no título ou na URL"? | TBD: é questão jurídica. A sigla não está listada, mas é abreviação de uma marca listada. Precisa de avaliação. | (Termos e diretrizes acima) | 23/10/2026 |
| Exibir arte e imagens da Blizzard: os Termos licenciam os "Data" (que incluem os links de mídia). A documentação de mídia recomenda copiar as imagens para servidor próprio. Os Termos não detalham as regras de exibição de arte. | Confirmado (texto). O alcance jurídico é TBD. | (link dos Termos acima) ; https://community.developer.battle.net/documentation/world-of-warcraft/guides/media-documents | 23/10/2026 |

### A9. Português do Brasil (`pt_BR`) na região US

| Afirmação | Status | Fonte (URL) | Data de consulta |
|---|---|---|---|
| O host `https://us.api.blizzard.com/` aceita `en_US`, `es_MX` e `pt_BR`. | Confirmado | https://community.developer.battle.net/documentation/guides/regionality-and-apis | 23/10/2026 |
| A API do WoW tem `pt_BR` entre os idiomas suportados (os exemplos oficiais trazem "Aliança"). | Confirmado | https://community.developer.battle.net/documentation/world-of-warcraft/guides/localization | 23/10/2026 |
| No cliente, `GetCurrentRegion()` = 1 corresponde a "Retail US", que inclui Brasil e Oceania. | Confirmado (wiki) | https://warcraft.wiki.gg/wiki/API_GetCurrentRegion | 23/10/2026 |

### A10. Supabase Auth

| Afirmação | Status | Fonte (URL) | Data de consulta |
|---|---|---|---|
| A lista de provedores sociais nativos (Apple, Azure, Bitbucket, Discord, Facebook, Figma, GitHub, GitLab, Google, Kakao, Keycloak, LinkedIn, Notion, Slack, Spotify, Twitter, Twitch, WorkOS, Zoom) **não inclui Battle.net/Blizzard**. | Confirmado | https://supabase.com/docs/guides/auth/social-login | 23/10/2026 |
| Para provedores fora da lista, o Supabase tem "Custom OAuth/OIDC Providers". O tipo OAuth2 é manual (URLs de authorization, token e userinfo). O tipo OIDC só pede o issuer e descobre o resto em `/.well-known/openid-configuration`. | Confirmado | https://supabase.com/docs/guides/auth/custom-oauth-providers | 23/10/2026 |
| O identificador precisa começar com `custom:`. O plano Free aceita até 3 provedores personalizados; do Pro para cima, ilimitado. | Confirmado | https://supabase.com/docs/guides/auth/custom-oauth-providers | 23/10/2026 |
| PKCE vem **ligado por padrão** (`pkce_enabled: true`) e pode ser desligado. Por padrão o provedor **precisa devolver e-mail**; `email_optional: true` permite login sem e-mail. Também existem `skip_nonce_check`, `discovery_url` e `authorization_params`. | Confirmado | https://supabase.com/docs/guides/auth/custom-oauth-providers | 23/10/2026 |
| Como o Supabase mapeia os campos do provedor (ID, BattleTag como nome) | TBD: a página não documenta o mapeamento de claims. | https://supabase.com/docs/guides/auth/custom-oauth-providers | 23/10/2026 |
| Compatibilidade do modo OIDC com a Battle.net: o issuer `https://oauth.battle.net` e o JWKS existem. Em 2019, o `iss` do `id_token` não batia com o issuer, e a Blizzard corrigiu em 25/11/2019. | O histórico está confirmado (Blizzard Developer). A compatibilidade atual é TBD e precisa de teste. | https://oauth.battle.net/.well-known/openid-configuration ; https://us.forums.blizzard.com/en/blizzard/t/battle-net-oauth-id-tokens-are-signed-with-incorrect-iss/729 | 23/10/2026 |

---

## Seção B: API de addons no Midnight (Retail 12.x)

### B1. Valor atual de `## Interface`

| Afirmação | Status | Fonte (URL) | Data de consulta |
|---|---|---|---|
| Cliente Retail ao vivo: **12.1.5.70529** em todas as regiões (us, eu, kr, tw, cn). | Confirmado (servidor oficial de versões da Blizzard) | https://us.version.battle.net/v2/products/wow/versions | 23/10/2026 |
| PTR Retail: **12.1.7.70493**. | Confirmado (servidor oficial de versões) | https://us.version.battle.net/v2/products/wowt/versions | 23/10/2026 |
| `## Interface` para o Retail 12.1.5 = **120105**. No PTR 12.1.7 = **120107**. | Confirmado (wiki, valores mantidos por colaboradores) | https://warcraft.wiki.gg/wiki/TOC_format ; https://warcraft.wiki.gg/wiki/Template:LatestPatchInfo | 23/10/2026 |
| Número de interface publicado em página da própria Blizzard | TBD: não encontrei. O valor do wiki bate com a versão oficial 12.1.5. | (nenhuma) | 23/10/2026 |
| No jogo, o número sai do 4º retorno de `GetBuildInfo()` (`interfaceVersion`). | Confirmado (documentação gerada pela Blizzard) | https://github.com/Gethe/wow-ui-source/blob/live/Interface/AddOns/Blizzard_APIDocumentationGenerated/BuildDocumentation.lua | 23/10/2026 |
| `## Interface` aceita vários valores separados por vírgula. Abaixo da versão do cliente, o addon é classificado como desatualizado. | Confirmado (wiki) | https://warcraft.wiki.gg/wiki/TOC_format | 23/10/2026 |
| Addons Retail com interface **menor que 120000 não carregam** no 12.0.0 em diante, e o jogador não pode forçar (comunicado da Blizzard de 17/11/2025, reproduzido no wiki). | Confirmado (Blizzard via wiki) | https://warcraft.wiki.gg/wiki/Patch_12.0.0/Planned_API_changes | 23/10/2026 |

### B2. `C_MountJournal` em 12.x e efeito dos "Secret Values"

| Afirmação | Status | Fonte (URL) | Data de consulta |
|---|---|---|---|
| `C_MountJournal.GetMountIDs()` existe na build 12.1.5.70529 e retorna uma tabela de `mountID`. | Confirmado (documentação gerada pela Blizzard) | https://github.com/Gethe/wow-ui-source/blob/live/Interface/AddOns/Blizzard_APIDocumentationGenerated/MountJournalDocumentation.lua | 23/10/2026 |
| `C_MountJournal.GetMountInfoByID(mountID)` retorna `name`, `spellID`, `icon`, `isActive`, `isUsable`, `sourceType`, `isFavorite`, `isFactionSpecific`, `faction`, `shouldHideOnChar`, **`isCollected`**, `mountID` e `isSteadyFlight`. | Confirmado | (mesma URL acima) | 23/10/2026 |
| `C_MountJournal.GetMountInfoExtraByID(mountID)` retorna `creatureDisplayInfoID`, `description`, `source`, `isSelfMount`, `mountTypeID` e outros campos. Também existe o evento `NEW_MOUNT_ADDED` (com `mountID`). | Confirmado | (mesma URL acima) | 23/10/2026 |
| Nenhuma dessas funções tem marcação de retorno secreto (`SecretReturns` ou `SecretWhen...`). `GetMountInfoByID` só traz `SecretArguments = "AllowedWhenUntainted"`, que quer dizer que o addon não pode passar um valor **secreto** como argumento. Um `mountID` vindo de `GetMountIDs` é valor comum, então isso não afeta o uso. | Confirmado (documentação gerada, mais o significado das marcações no wiki) | (mesma URL acima) ; https://warcraft.wiki.gg/wiki/Secret_Values | 23/10/2026 |
| Comportamento real em combate ou dentro de instância (M+, raide, PvP) | TBD: não testei no jogo. A documentação não marca restrição. Recomendo ler a coleção no login, fora de combate, o que evita qualquer restrição. | — | 23/10/2026 |

### B3. Resumo das restrições de addons no Midnight

| Afirmação | Status | Fonte (URL) | Data de consulta |
|---|---|---|---|
| Filosofia oficial: "Addons should no longer offer a competitive advantage in WoW combat". A informação do estado de combate vira "secret value": o addon pode **exibir**, mas não pode **saber** o valor. A personalização visual continua permitida. | Confirmado (artigo oficial da Blizzard, 13/11/2025) | https://news.blizzard.com/en-us/article/24246290/combat-philosophy-and-addon-disarmament-in-midnight | 23/10/2026 |
| A Blizzard pôs recursos nativos no lugar: Cooldown Manager, Boss Warnings, Combat Audio Alerts, melhorias de quadros de raide e Damage Meter com validação no servidor. | Confirmado | https://news.blizzard.com/en-us/article/24246290/combat-philosophy-and-addon-disarmament-in-midnight ; https://worldofwarcraft.blizzard.com/en-us/news/24244455/midnight-pre-expansion-content-update-notes | 23/10/2026 |
| `COMBAT_LOG_EVENT` e `COMBAT_LOG_EVENT_UNFILTERED` não estão mais disponíveis para addons (registrar dá erro), e as mensagens do log de combate viraram KStrings. | Confirmado (Blizzard via wiki) | https://warcraft.wiki.gg/wiki/Patch_12.0.0/API_changes ; https://warcraft.wiki.gg/wiki/Patch_12.0.0/Planned_API_changes | 23/10/2026 |
| Código de addon ("tainted") não pode fazer conta, comparar, indexar nem usar como chave um valor secreto; tentar isso dá erro imediato. Pode guardar e repassar. Fora de código tainted, segredos se comportam como valores comuns. | Confirmado (wiki) | https://warcraft.wiki.gg/wiki/Secret_Values | 23/10/2026 |
| Os segredos aparecem de forma condicional ("predicados"): em combate, encontro de chefe, Mítica+ ativa, partida PvP ativa e mapas restritos (masmorra e raide). | Confirmado (wiki, a partir da documentação gerada) | https://warcraft.wiki.gg/wiki/Secret_Values | 23/10/2026 |
| Nomes, GUIDs e IDs de **criaturas** são secretos dentro de instância. | Confirmado (Blizzard via wiki) | https://warcraft.wiki.gg/wiki/Patch_12.0.0/Planned_API_changes | 23/10/2026 |
| Mensagens entre addons e leitura de chat ficam restritas durante Mítica+ ativa, partida PvP ativa ou encontro em andamento. | Confirmado (Blizzard via wiki) | https://warcraft.wiki.gg/wiki/Patch_12.0.0/Planned_API_changes | 23/10/2026 |
| **SavedVariables não podem conter valores secretos.** | Confirmado (Blizzard via wiki) | https://warcraft.wiki.gg/wiki/Patch_12.0.0/Planned_API_changes | 23/10/2026 |
| `C_Housing.VisitHouse`, `C_Housing.TeleportHome` e `C_Housing.ReturnAfterVisitingHouse` não podem ser chamadas por addons; existem "secure action delegates" no lugar. | Confirmado (Blizzard via wiki) | https://warcraft.wiki.gg/wiki/Patch_12.0.0/Planned_API_changes | 23/10/2026 |

### B4. Funções para identificar personagem e região, e eventos

| Afirmação | Status | Fonte (URL) | Data de consulta |
|---|---|---|---|
| `UnitGUID(unit)` existe em 12.1.5 e tem a marcação `SecretWhenUnitIdentityRestricted = true`. | Confirmado (documentação gerada) | https://github.com/Gethe/wow-ui-source/blob/live/Interface/AddOns/Blizzard_APIDocumentationGenerated/UnitDocumentation.lua | 23/10/2026 |
| A restrição de identidade documentada vale para unidades de criatura dentro de instância. `UnitGUID("player")` não é citado como secreto. | Confirmado parcialmente (wiki). No jogo é TBD; recomendo ler no `PLAYER_LOGIN`. | https://warcraft.wiki.gg/wiki/Secret_Values ; https://warcraft.wiki.gg/wiki/Patch_12.0.0/Planned_API_changes | 23/10/2026 |
| `GetRealmName`, `GetNormalizedRealmName`, `GetRealmID`, `GetCurrentRegion`, `GetCurrentRegionName` e `GetBuildInfo` estão na lista de funções globais da build ao vivo 12.1.5. | Confirmado (dump do cliente) | https://github.com/Ketho/BlizzardInterfaceResources/blob/live/Resources/GlobalAPI.lua | 23/10/2026 |
| `GetNormalizedRealmName()` só retorna valor a partir do `PLAYER_LOGIN` e pode voltar `nil` durante tela de carregamento. | Confirmado (wiki) | https://warcraft.wiki.gg/wiki/API_GetRealmName | 23/10/2026 |
| `GetCurrentRegion()`: 1 = US (inclui Brasil e Oceania), 2 = KR, 3 = EU, 4 = TW, 5 = CN. `GetCurrentRegionName()` existe desde o 9.0.1. | Confirmado (wiki) | https://warcraft.wiki.gg/wiki/API_GetCurrentRegion ; https://warcraft.wiki.gg/wiki/API_GetCurrentRegionName | 23/10/2026 |
| `GetBuildInfo()` retorna `buildVersion`, `buildNumber`, `buildDate`, `interfaceVersion`, `localizedVersion` e `buildInfo`. | Confirmado (documentação gerada) | https://github.com/Gethe/wow-ui-source/blob/live/Interface/AddOns/Blizzard_APIDocumentationGenerated/BuildDocumentation.lua | 23/10/2026 |
| Eventos existentes em 12.1.5: `ADDON_LOADED` (`addOnName`, `containsBindings`), `PLAYER_LOGIN`, `PLAYER_LOGOUT` e `PLAYER_ENTERING_WORLD`. | Confirmado (documentação gerada e dump de eventos) | https://github.com/Gethe/wow-ui-source/blob/live/Interface/AddOns/Blizzard_APIDocumentationGenerated/AddOnsDocumentation.lua ; https://github.com/Gethe/wow-ui-source/blob/live/Interface/AddOns/Blizzard_APIDocumentationGenerated/SystemDocumentation.lua ; https://github.com/Ketho/BlizzardInterfaceResources/blob/live/Resources/Events.lua | 23/10/2026 |

### B5. Formato do arquivo SavedVariables

| Afirmação | Status | Fonte (URL) | Data de consulta |
|---|---|---|---|
| As variáveis a salvar são declaradas no `.toc`: `## SavedVariables:` (por conta) e `## SavedVariablesPerCharacter:` (por personagem). Também existe `## LoadSavedVariablesFirst: 1`. | Confirmado (wiki) | https://warcraft.wiki.gg/wiki/Saving_variables_between_game_sessions ; https://warcraft.wiki.gg/wiki/TOC_format | 23/10/2026 |
| Onde ficam: `World of Warcraft\_retail_\WTF\Account\<CONTA>\SavedVariables\<Addon>.lua` (por conta) e `...\WTF\Account\<CONTA>\<Reino>\<Personagem>\SavedVariables\<Addon>.lua` (por personagem). | Confirmado (wiki) | https://warcraft.wiki.gg/wiki/SavedVariables ; https://warcraft.wiki.gg/wiki/Saving_variables_between_game_sessions | 23/10/2026 |
| Quando são gravados: ao sair do personagem, desconectar, fechar o jogo ou dar `/reload`. `PLAYER_LOGOUT` é o último evento antes da gravação. | Confirmado (wiki) | https://warcraft.wiki.gg/wiki/Saving_variables_between_game_sessions | 23/10/2026 |
| Quando são carregados: depois do código do addon. `ADDON_LOADED` avisa que as variáveis daquele addon já estão disponíveis. | Confirmado (wiki) | https://warcraft.wiki.gg/wiki/Saving_variables_between_game_sessions | 23/10/2026 |
| O formato é Lua puro (atribuições a variáveis globais). Só são salvos string, boolean, number e table; funções e userdata não. Referências circulares podem se perder. | Confirmado (wiki) | https://warcraft.wiki.gg/wiki/SavedVariables ; https://warcraft.wiki.gg/wiki/Saving_variables_between_game_sessions | 23/10/2026 |
| Sintaxe exata gravada pelo cliente (aspas, `["chave"] = valor,`, indentação, ordem) | TBD: as fontes dizem só "plain Lua". Confirmar com um arquivo real gerado pelo cliente. O leitor do site deve aceitar qualquer tabela Lua literal e **nunca executar** o arquivo. | — | 23/10/2026 |
| SavedVariables não podem conter valores secretos (Midnight). | Confirmado (Blizzard via wiki) | https://warcraft.wiki.gg/wiki/Patch_12.0.0/Planned_API_changes | 23/10/2026 |

### B6. Habitação: API Lua de catálogo de decoração

| Afirmação | Status | Fonte (URL) | Data de consulta |
|---|---|---|---|
| `C_HousingCatalog` existe na build 12.1.5.70529 (sistema "HousingCatalogUI", `Environment = "All"`). | Confirmado (documentação gerada) | https://github.com/Gethe/wow-ui-source/blob/live/Interface/AddOns/Blizzard_APIDocumentationGenerated/HousingCatalogUIDocumentation.lua | 23/10/2026 |
| Funções de leitura: `GetCatalogEntryInfoByRecordID`, `GetCatalogEntryInfoByItem`, `GetCatalogEntryInfo`, `GetDecorTotalOwnedCount`, `GetDecorMaxOwnedCount`, `GetCatalogCategoryInfo`, `SearchCatalogCategories` e `CreateCatalogSearcher`. O "searcher" tem filtros `SetCollected`, `SetUncollected` e `SetStoredOnly`, além de `RunSearch` e `GetCatalogSearchResults`. | Confirmado | (mesma URL acima) ; https://github.com/Gethe/wow-ui-source/blob/live/Interface/AddOns/Blizzard_APIDocumentationGenerated/HousingCatalogSearcherAPIDocumentation.lua | 23/10/2026 |
| `HousingCatalogEntryInfo` traz `recordID`, `entryType`, `itemID`, `name`, `iconTexture`, `categoryIDs`, `size`, `placementCost`, **`totalNumStored`**, `remainingRedeemable`, **`totalNumPlaced`**, `isAllowedIndoors`, `isAllowedOutdoors`, `canCustomize`, `quality`, `firstAcquisitionBonus`, `sourceText` e outros campos. | Confirmado | (mesma URL acima) | 23/10/2026 |
| Só as ações de loja e carrinho (`HousingMarketActionAddToCart`, `ClearCart`, `RemoveFromCart`, `ViewBundle`, `ViewInStore`) têm `HasRestrictions = true`. As funções de leitura não têm marcação de retorno secreto. | Confirmado | (mesma URL acima) | 23/10/2026 |
| Eventos: `HOUSING_STORAGE_UPDATED`, `HOUSING_STORAGE_ENTRY_UPDATED`, `HOUSING_CATALOG_CATEGORY_UPDATED` e outros. `HOUSE_DECOR_ADDED_TO_CHEST` aparece no dump de eventos. | Confirmado | (mesma URL acima) ; https://github.com/Ketho/BlizzardInterfaceResources/blob/live/Resources/Events.lua | 23/10/2026 |
| Se os dados do catálogo e da posse ficam disponíveis logo no login, sem abrir a interface de habitação nem estar na casa | TBD: precisa de teste no jogo. | — | 23/10/2026 |
| Alternativa sem addon: a Web API tem a coleção de decoração da conta (`/profile/user/wow/collections/decor`) e o catálogo (`/data/wow/decor/...`). | Confirmado | https://community.developer.battle.net/documentation/world-of-warcraft/profile-apis ; https://community.developer.battle.net/documentation/world-of-warcraft/game-data-apis | 23/10/2026 |

---

## Implicações para o WoWHelp

### Pode ser construído já, sem credencial

- **Estrutura e modelo de dados** do catálogo e das coleções (montaria, mascote, brinquedo, herança, transmog, decoração), com chaves pelos IDs da Blizzard (`mountID`, `decorId`) e textos em `pt_BR`.
- **Telas com dados de exemplo**, enquanto não houver chamada real.
- **Esqueleto do addon (Fase 5):**
  - `.toc` com `## Interface: 120105`. Quando o 12.1.7 sair, dá para listar `120105, 120107` separados por vírgula;
  - `## SavedVariables:` e coleta no `PLAYER_LOGIN`, fora de combate: `GetMountIDs` mais `GetMountInfoByID().isCollected`, `UnitGUID("player")`, `GetRealmName()`, `GetNormalizedRealmName()`, `GetCurrentRegion()` e `GetBuildInfo()`;
  - opcionalmente, `C_HousingCatalog` para quantidades de decoração.
- **Leitor do arquivo SavedVariables no site:**
  - interpretar a tabela Lua sem executar código;
  - o arquivo só é gravado quando o jogador sai ou dá `/reload`, então a tela de envio deve dizer isso ao usuário.
- **Fluxo de login no servidor (Next.js):**
  - Authorization Code com `state`;
  - segredo só no servidor;
  - token no cabeçalho;
  - pressupor token de 24 h **sem refresh**, ou seja, sincronizar a coleção logo após o login e guardar o resultado.

### Depende de credencial (cliente registrado pelo Bruno no portal, com autenticador e aceite dos Termos)

- **Catálogo via Game Data API** (montarias, decoração, mídia): basta Client Credentials, sem login de usuário. As imagens devem ser copiadas para o Storage do próprio projeto, como a Blizzard recomenda, com crédito à Blizzard.
- **Coleção da conta** (montarias, decoração etc. de todos os personagens): exige login do jogador com `wow.profile`.
- **Supabase:**
  - Battle.net precisa entrar como provedor personalizado (`custom:battlenet`), no modo OAuth2 manual ou no modo OIDC com issuer `https://oauth.battle.net`;
  - quase certamente com `email_optional: true`, porque não há escopo de e-mail documentado;
  - o PKCE vem ligado no Supabase, e se a Battle.net recusar, desliga-se `pkce_enabled`. Isso só se decide com teste.

### Teste mínimo para fechar os TBD (quando houver credencial)

1. Fazer um login de teste com `scope=openid wow.profile` e anotar a resposta do `/token`: se vem `refresh_token` e se vem `id_token`.
2. Anotar os campos de `/userinfo` e do `id_token`, inclusive se existe e-mail.
3. Repetir o login enviando `code_challenge` (S256) para ver se o host global aceita PKCE.
4. Chamar `/profile/user/wow`, `/profile/user/wow/collections/mounts` e `/profile/user/wow/collections/decor` com `namespace=profile-us&locale=pt_BR` e registrar o formato das respostas.
5. Com Client Credentials, chamar `/data/wow/mount/index` e um `/data/wow/mount/{id}` e registrar os campos reais (fecha o TBD do A6).
6. Testar `/house/house-1` contra `/house/{id}`, o cabeçalho de limite (`429`) e o `POST /revoke`.
7. No jogo: gerar um SavedVariables real do addon e conferir a sintaxe; testar `C_HousingCatalog` logo no login.

### Regras que afetam produto e jurídico (antes de publicar)

- **Monetização:** nada pago, "premium", doação obrigatória nem anúncio em vídeo obrigatório em recurso que use a API. Os dados não podem ser usados em publicidade.
- **Guarda de dados:** limpeza ou revalidação automática de tudo que veio da API a cada **30 dias**, e apagamento quando o usuário pedir ou desvincular a conta.
- **Política de privacidade** publicada, público de **13 anos ou mais**, conteúdo "T for Teen" e crédito visível "dados fornecidos pela Blizzard", sem sugerir parceria.
- **Nome e domínio:** a cláusula "sem marcas da Blizzard no título ou na URL" pede avaliação do nome **WoWHelp** antes de registrar domínio ou divulgar (TBD jurídico).
