-- WoWHelp Companion: ciclo de vida.
-- O addon não acessa a internet e não envia nada: só grava WoWHelpCompanionDB, que
-- o jogo salva no disco ao sair ou com /reload. O jogador envia o arquivo no site.
local ADDON, ns = ...

local frame = CreateFrame("Frame")
local pendingSnapshot = false

local function countCharacters(db)
  local n = 0
  for _ in pairs(db.characters) do n = n + 1 end
  return n
end

-- Mantém no máximo MAX_CHARACTERS, descartando os observados há mais tempo.
local function trimCharacters(db)
  while countCharacters(db) > ns.MAX_CHARACTERS do
    local oldestKey, oldestAt
    for key, c in pairs(db.characters) do
      local at = type(c) == "table" and c.observedAt or 0
      if not oldestAt or at < oldestAt then oldestKey, oldestAt = key, at end
    end
    db.characters[oldestKey] = nil
  end
end

function ns.Snapshot()
  local db = WoWHelpCompanionDB
  if not db then return end
  if InCombatLockdown and InCombatLockdown() then
    pendingSnapshot = true
    frame:RegisterEvent("PLAYER_REGEN_ENABLED")
    return
  end

  db.region = ns.ReadRegion()
  db.client = ns.ReadClient()
  db.weeklyResetAt = ns.ReadWeeklyResetAt()

  local guid, character = ns.ReadCharacter()
  if guid and character then
    db.characters[guid] = character
    trimCharacters(db)
  end

  local mounts = ns.ReadCollectedMounts()
  if mounts then
    db.account.mounts = { available = true, observedAt = time(), collected = mounts }
  else
    db.account.mounts.available = false
  end

  db.lastObservedAt = time()
end

frame:RegisterEvent("ADDON_LOADED")
frame:RegisterEvent("PLAYER_LOGIN")
frame:RegisterEvent("NEW_MOUNT_ADDED")
frame:RegisterEvent("PLAYER_LOGOUT")

frame:SetScript("OnEvent", function(_, event, arg1)
  if event == "ADDON_LOADED" and arg1 == ADDON then
    WoWHelpCompanionDB = ns.MigrateDB(WoWHelpCompanionDB)
  elseif event == "PLAYER_LOGIN" or event == "NEW_MOUNT_ADDED" then
    ns.Snapshot()
  elseif event == "PLAYER_REGEN_ENABLED" and pendingSnapshot then
    pendingSnapshot = false
    frame:UnregisterEvent("PLAYER_REGEN_ENABLED")
    ns.Snapshot()
  elseif event == "PLAYER_LOGOUT" and WoWHelpCompanionDB then
    WoWHelpCompanionDB.lastObservedAt = time()
  end
end)
