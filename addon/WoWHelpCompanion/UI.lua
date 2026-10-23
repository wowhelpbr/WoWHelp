-- WoWHelp Companion: comando /wowhelp (status e instruções).
local ADDON, ns = ...

local L = {
  enUS = {
    header = "|cffffc629WoWHelp Companion|r v%s (data v%d)",
    last = "Last snapshot: %s",
    never = "no snapshot yet",
    counts = "%d character(s) saved; %s",
    mounts = "%d mounts collected",
    mountsOff = "mount collection unavailable in this client",
    howTo = "To import: type /reload or log out, then upload WTF\\Account\\<ACCOUNT>\\SavedVariables\\WoWHelpCompanion.lua on the WoWHelp site.",
    privacy = "This addon has no internet access and reads no combat data.",
  },
  ptBR = {
    header = "|cffffc629WoWHelp Companion|r v%s (dados v%d)",
    last = "Última leitura: %s",
    never = "nenhuma leitura ainda",
    counts = "%d personagem(ns) salvo(s); %s",
    mounts = "%d montarias coletadas",
    mountsOff = "coleção de montarias indisponível neste cliente",
    howTo = "Para importar: digite /reload ou saia do jogo e envie WTF\\Account\\<CONTA>\\SavedVariables\\WoWHelpCompanion.lua no site do WoWHelp.",
    privacy = "Este addon não acessa a internet e não lê dados de combate.",
  },
}

local function text()
  return L[GetLocale and GetLocale() == "ptBR" and "ptBR" or "enUS"]
end

SLASH_WOWHELP1 = "/wowhelp"
SlashCmdList.WOWHELP = function()
  local t, db = text(), WoWHelpCompanionDB
  if not db then return end
  local n = 0
  for _ in pairs(db.characters or {}) do n = n + 1 end
  local m = db.account and db.account.mounts or {}
  local mountsText = m.available and string.format(t.mounts, #(m.collected or {})) or t.mountsOff

  print(string.format(t.header, ns.ADDON_VERSION, ns.SCHEMA_VERSION))
  print(string.format(t.last, (db.lastObservedAt or 0) > 0 and date("%Y-%m-%d %H:%M", db.lastObservedAt) or t.never))
  print(string.format(t.counts, n, mountsText))
  print(t.howTo)
  print(t.privacy)
end
