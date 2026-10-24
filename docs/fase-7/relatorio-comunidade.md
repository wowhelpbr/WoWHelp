# Comunidade BR: relatório

Data: 23/10/2026. Pedido do Bruno: área para enaltecer criadores brasileiros de WoW, com quem está ao vivo (Twitch, YouTube, Kick), novidades e destaque, tudo curado por ele.

## O que está no ar

| Parte | Situação |
| --- | --- |
| Página pública `/community` | Feita: ao vivo agora, destaque, novidades, diretório com filtro por assunto |
| Curadoria `/admin/community` | Feita: cadastrar criador (nome, apresentação pt/en, até 6 assuntos, canais Twitch/YouTube/Kick), publicar/ocultar, destaque com motivo, apagar |
| "Quero ser listado" / "quero sair" | Feito em `/community/join` (precisa de conta; no máximo 3 pedidos em aberto). Pedidos aparecem na curadoria |
| Ao vivo e novidades | Prontos, ligam quando as chaves forem cadastradas na Vercel (abaixo). Atualização a cada 10 min pelo GitHub Actions (`comunidade.yml`) |
| Kick | Pronto: a Public API da Kick aceita token do próprio app (sem login do criador) e `/public/v1/channels` diz se está ao vivo, com título, espectadores e miniatura |
| Privacidade | Política ganhou a seção "Criadores na Comunidade BR" (dados públicos, legítimo interesse, pedido de saída) |

Fontes oficiais: Kick Public API (token em `https://id.kick.com/oauth/token` com client credentials, `GET https://api.kick.com/public/v1/channels?slug=...`, docs.kick.com); Twitch Helix (`/helix/users`, `/helix/streams`, token do app); YouTube Data API v3 (`channels` por handle, `videos` para saber se está ao vivo) e o feed público do canal (`/feeds/videos.xml`, não gasta cota). Cota estimada do YouTube: menos de 1.000 unidades por dia para 100 canais (limite grátis: 10.000).

## Como ligar o "ao vivo agora" (Bruno)

Use contas do WoWHelp, não as pessoais. As chaves vão **direto na Vercel**, nunca no chat.

### Twitch (uns 5 minutos)

1. Abra https://dev.twitch.tv/console e entre com a conta da Twitch do WoWHelp (a Twitch pede verificação em duas etapas ligada).
2. Clique em **"Register Your Application"**.
3. Preencha: nome **WoWHelp Comunidade**; OAuth Redirect URL **https://wowhelp.vercel.app**; categoria **Website Integration**; tipo de cliente **Confidential**. Clique em **"Create"**.
4. Na lista, clique em **"Manage"** no app. Copie o **Client ID**. Clique em **"New Secret"** e copie o segredo.
5. Cadastre os dois com o script (abaixo).

### YouTube (uns 5 minutos)

1. Abra https://console.cloud.google.com com a conta Google do WoWHelp e crie um projeto chamado **WoWHelp**.
2. Vá em **APIs e serviços** > **Biblioteca**, procure **YouTube Data API v3** e clique em **Ativar**.
3. Vá em **Credenciais** > **Criar credenciais** > **Chave de API**.
4. Clique na chave criada > **Restrições de API** > **Restringir chave** > marque só **YouTube Data API v3** > **Salvar**.
5. Cadastre com o script (abaixo).

### Kick (uns 5 minutos)

1. Entre em https://kick.com com a conta da Kick do WoWHelp e ligue a **verificação em duas etapas** (Configurações da conta > Segurança). A Kick exige isso para criar apps.
2. Abra https://kick.com/settings/developer e crie um app: nome **WoWHelp Comunidade**; Redirect URL **https://wowhelp.vercel.app**. Não precisa marcar nenhuma permissão.
3. Copie o **Client ID** e o **Client Secret**.

### Cadastrar na Vercel sem expor a chave

No PowerShell, na pasta do projeto, rode um comando por chave. Ele pede o valor escondido, confere se a Vercel está na conta do WoWHelp e (no caso do YouTube) testa a chave no Google antes de salvar:

```powershell
powershell -ExecutionPolicy Bypass -File scripts\cadastrar-chave-vercel.ps1 YOUTUBE_API_KEY
powershell -ExecutionPolicy Bypass -File scripts\cadastrar-chave-vercel.ps1 KICK_CLIENT_ID
powershell -ExecutionPolicy Bypass -File scripts\cadastrar-chave-vercel.ps1 KICK_CLIENT_SECRET
powershell -ExecutionPolicy Bypass -File scripts\cadastrar-chave-vercel.ps1 TWITCH_CLIENT_ID
powershell -ExecutionPolicy Bypass -File scripts\cadastrar-chave-vercel.ps1 TWITCH_CLIENT_SECRET
```

### Depois

Me avise: eu publico de novo (a chave só vale depois de um novo deploy), disparo a primeira atualização e confiro se as lives aparecem.

## Como cadastrar um criador

1. **Configurações** > **Abrir a curadoria** > **Comunidade BR** > **Novo criador**.
2. Nome, canais (pode colar o link ou só o nome do canal), assuntos e apresentação.
3. **Situação: Publicado** para aparecer no site. **Mostrar em Destaque** coloca no bloco de cima com o motivo que você escrever.
