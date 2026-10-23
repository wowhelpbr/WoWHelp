-- WoWHelp Companion: estrutura e versão dos dados salvos (SavedVariables).
-- O site só aceita o formato descrito aqui (schemaVersion 1).
local ADDON, ns = ...

ns.SCHEMA_VERSION = 1
ns.ADDON_VERSION = "0.1.0"

-- Limites para o arquivo nunca crescer sem controle.
ns.MAX_CHARACTERS = 60

local function fresh()
  return {
    schemaVersion = ns.SCHEMA_VERSION,
    addonVersion = ns.ADDON_VERSION,
    lastObservedAt = 0,
    region = nil,
    client = {},
    weeklyResetAt = nil,
    account = { mounts = { available = false, observedAt = 0, collected = {} } },
    characters = {},
  }
end

-- Garante a tabela no formato atual. Versão desconhecida ou corrompida recomeça do zero:
-- os dados são só uma cópia do que o jogo já sabe, então nada se perde de verdade.
function ns.MigrateDB(db)
  if type(db) ~= "table" or type(db.schemaVersion) ~= "number" or db.schemaVersion > ns.SCHEMA_VERSION then
    return fresh()
  end
  if type(db.account) ~= "table" then db.account = {} end
  if type(db.account.mounts) ~= "table" then db.account.mounts = { available = false, observedAt = 0, collected = {} } end
  if type(db.characters) ~= "table" then db.characters = {} end
  if type(db.client) ~= "table" then db.client = {} end
  db.schemaVersion = ns.SCHEMA_VERSION
  db.addonVersion = ns.ADDON_VERSION
  return db
end
