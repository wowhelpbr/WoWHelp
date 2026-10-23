# Comunidade BR: relatório

Data: 23/10/2026. Pedido do Bruno: área para enaltecer criadores brasileiros de WoW, com quem está ao vivo (Twitch, YouTube, Kick), novidades e destaque, tudo curado por ele.

## O que está no ar

| Parte | Situação |
| --- | --- |
| Página pública `/community` | Feita: ao vivo agora, destaque, novidades, diretório com filtro por assunto |
| Curadoria `/admin/community` | Feita: cadastrar criador (nome, apresentação pt/en, até 6 assuntos, canais Twitch/YouTube/Kick), publicar/ocultar, destaque com motivo, apagar |
| "Quero ser listado" / "quero sair" | Feito em `/community/join` (precisa de conta; no máximo 3 pedidos em aberto). Pedidos aparecem na curadoria |
| Ao vivo e novidades | Prontos, ligam quando as chaves forem cadastradas na Vercel (abaixo). Atualização a cada 10 min pelo GitHub Actions (`comunidade.yml`) |
| Kick | Só o link do canal por enquanto. Ainda falta confirmar se a API oficial da Kick mostra quem está ao vivo sem login do criador |
| Privacidade | Política ganhou a seção "Criadores na Comunidade BR" (dados públicos, legítimo interesse, pedido de saída) |

Fontes oficiais: Twitch Helix (`/helix/users`, `/helix/streams`, token do app); YouTube Data API v3 (`channels` por handle, `videos` para saber se está ao vivo) e o feed público do canal (`/feeds/videos.xml`, não gasta cota). Cota estimada do YouTube: menos de 1.000 unidades por dia para 100 canais (limite grátis: 10.000).

## Como ligar o "ao vivo agora" (Bruno)

Use contas do WoWHelp, não as pessoais. As chaves vão **direto na Vercel**, nunca no chat.

### Twitch (uns 5 minutos)

1. Abra https://dev.twitch.tv/console e entre com a conta da Twitch do WoWHelp (a Twitch pede verificação em duas etapas ligada).
2. Clique em **"Register Your Application"**.
3. Preencha: nome **WoWHelp Comunidade**; OAuth Redirect URL **https://wowhelp.vercel.app**; categoria **Website Integration**; tipo de cliente **Confidential**. Clique em **"Create"**.
4. Na lista, clique em **"Manage"** no app. Copie o **Client ID**. Clique em **"New Secret"** e copie o segredo.
5. Na Vercel: projeto **wowhelp** > **Settings** > **Environment Variables**. Crie `TWITCH_CLIENT_ID` e `TWITCH_CLIENT_SECRET` (marque Production e Preview, e "Sensitive" no segredo).

### YouTube (uns 5 minutos)

1. Abra https://console.cloud.google.com com a conta Google do WoWHelp e crie um projeto chamado **WoWHelp**.
2. Vá em **APIs e serviços** > **Biblioteca**, procure **YouTube Data API v3** e clique em **Ativar**.
3. Vá em **Credenciais** > **Criar credenciais** > **Chave de API**.
4. Clique na chave criada > **Restrições de API** > **Restringir chave** > marque só **YouTube Data API v3** > **Salvar**.
5. Na Vercel, crie `YOUTUBE_API_KEY` com essa chave (Production e Preview, "Sensitive").

### Depois

Na Vercel, em **Deployments**, clique nos três pontos do último deploy e em **"Redeploy"**. Me avise: eu disparo a primeira atualização e confiro se as lives aparecem.

## Como cadastrar um criador

1. **Configurações** > **Abrir a curadoria** > **Comunidade BR** > **Novo criador**.
2. Nome, canais (pode colar o link ou só o nome do canal), assuntos e apresentação.
3. **Situação: Publicado** para aparecer no site. **Mostrar em Destaque** coloca no bloco de cima com o motivo que você escrever.
