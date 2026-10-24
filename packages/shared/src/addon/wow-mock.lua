-- WoW de mentira para testar o addon fora do jogo (só nos testes).
-- Imita as funções públicas que o WoWHelp Companion usa, com dados de TESTE.

__frames = {}
__printed = {}
__now = 1792742400 -- 2026-10-23 08:00 UTC
__combat = false
__player = {
  guid = "Player-1234-0ABCDEF0",
  name = "Testmage",
  realm = "Test Realm",
  realmSlug = "TestRealm",
  level = 80,
  class = { "Mago", "MAGE", 8 },
  race = { "Anão", "Dwarf", 3 },
  faction = "Alliance",
}
__mounts = { [6] = true, [7] = true, [8] = false }
__region = 1

function CreateFrame()
  local f = { events = {} }
  function f:RegisterEvent(e) self.events[e] = true end
  function f:UnregisterEvent(e) self.events[e] = nil end
  function f:SetScript(kind, fn) if kind == "OnEvent" then self.onEvent = fn end end
  table.insert(__frames, f)
  return f
end

function __fire(event, ...)
  for _, f in ipairs(__frames) do
    if f.events[event] and f.onEvent then f.onEvent(f, event, ...) end
  end
end

function time() return __now end
function date(fmt, t) return "2026-10-23 08:00" end
function print(...) table.insert(__printed, table.concat({ ... }, " ")) end
function GetLocale() return "ptBR" end
function InCombatLockdown() return __combat end
function GetCurrentRegion() return __region end
function GetBuildInfo() return "12.1.5", "70529", "Oct 1 2026", 120105 end
function GetRealmName() return __player.realm end
function GetNormalizedRealmName() return __player.realmSlug end
function UnitGUID(unit) if unit == "player" then return __player.guid end end
function UnitName(unit) if unit == "player" then return __player.name end end
function UnitLevel() return __player.level end
function UnitClass() return __player.class[1], __player.class[2], __player.class[3] end
function UnitRace() return __player.race[1], __player.race[2], __player.race[3] end
function UnitFactionGroup() return __player.faction end

C_DateAndTime = { GetSecondsUntilWeeklyReset = function() return 3600 * 30 end }

C_MountJournal = {
  GetMountIDs = function()
    local ids = {}
    for id in pairs(__mounts) do ids[#ids + 1] = id end
    table.sort(ids)
    return ids
  end,
  -- 11º retorno = isCollected, como na API do jogo.
  GetMountInfoByID = function(id)
    return "Mount " .. id, 1000 + id, 1, false, true, 0, false, false, nil, false, __mounts[id] == true
  end,
}

SlashCmdList = {}

-- Grava a tabela no formato do arquivo SavedVariables do jogo:
-- chaves entre colchetes, listas com comentário "-- [n]".
local function quote(s)
  return '"' .. s:gsub("\\", "\\\\"):gsub('"', '\\"'):gsub("\n", "\\n") .. '"'
end

local function isList(t)
  local n = 0
  for _ in pairs(t) do n = n + 1 end
  for i = 1, n do if t[i] == nil then return false end end
  return n > 0
end

local function dump(value, indent, out)
  local kind = type(value)
  if kind == "table" then
    out[#out + 1] = "{\n"
    if isList(value) then
      for i, v in ipairs(value) do
        out[#out + 1] = indent .. "\t"
        dump(v, indent .. "\t", out)
        out[#out + 1] = ", -- [" .. i .. "]\n"
      end
    else
      local keys = {}
      for k in pairs(value) do keys[#keys + 1] = k end
      table.sort(keys, function(a, b) return tostring(a) < tostring(b) end)
      for _, k in ipairs(keys) do
        local key = type(k) == "number" and ("[" .. k .. "]") or ("[" .. quote(k) .. "]")
        out[#out + 1] = indent .. "\t" .. key .. " = "
        dump(value[k], indent .. "\t", out)
        out[#out + 1] = ",\n"
      end
    end
    out[#out + 1] = indent .. "}"
  elseif kind == "string" then
    out[#out + 1] = quote(value)
  elseif kind == "number" or kind == "boolean" then
    out[#out + 1] = tostring(value)
  else
    out[#out + 1] = "nil"
  end
end

function __savedVariables()
  local out = { "\nWoWHelpCompanionDB = " }
  dump(WoWHelpCompanionDB, "", out)
  out[#out + 1] = "\n"
  return table.concat(out)
end
