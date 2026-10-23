# WoWHelp Companion (addon)

Addon do World of Warcraft Retail (Midnight, interface 120105) que salva no seu computador os seus personagens e a coleção de montarias da conta, para você importar no site do WoWHelp.

## O que ele faz

- No login (fora de combate) e quando você ganha uma montaria nova, lê: personagem (nome, reino, nível, classe, raça, facção), região, versão do jogo, horário do próximo reset semanal e a lista de montarias coletadas.
- Grava tudo em `WoWHelpCompanionDB` (SavedVariables), que o próprio jogo salva no disco ao sair ou com `/reload`.
- `/wowhelp` mostra a versão, a última leitura e como importar.

## O que ele NÃO faz

- Não acessa a internet nem envia nada (addons não conseguem; o envio é você quem faz no site).
- Não lê combate, chat, amigos, guilda nem valores secretos do Midnight.
- Não automatiza nenhuma ação no jogo.

## Como instalar

1. Copie a pasta `WoWHelpCompanion` para `World of Warcraft\_retail_\Interface\AddOns\`.
2. Entre no jogo com cada personagem que quiser importar.
3. Digite `/reload` (ou saia do jogo).
4. No site, vá em **Importar addon** e envie o arquivo `World of Warcraft\_retail_\WTF\Account\<SUA CONTA>\SavedVariables\WoWHelpCompanion.lua`.

## Formato salvo (schemaVersion 1)

```lua
WoWHelpCompanionDB = {
  schemaVersion = 1, addonVersion = "0.1.0", lastObservedAt = <epoch>,
  region = "us", client = { version = "12.1.5", build = "...", interface = 120105 },
  weeklyResetAt = <epoch ou nil>,
  account = { mounts = { available = true, observedAt = <epoch>, collected = { <mountID>, ... } } },
  characters = { ["Player-<servidor>-<id>"] = { name, realm, realmSlug, level, classId, className, classFile, raceId, raceName, faction, observedAt } },
}
```

O site lê esse arquivo **sem executar Lua** (parser próprio que só aceita tabelas, textos, números e verdadeiro/falso) e só grava os campos desta lista.

## Testes pendentes no jogo

Precisa de teste real no cliente Retail 12.1.5: instalação sem erros, `/reload`, logout, dois personagens e coleção de montarias (ver `docs/fase-5/relatorio-fase-5.md`).
