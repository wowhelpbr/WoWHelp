-- WoWHelp Companion: identificação do personagem e do cliente.
-- Só funções públicas e documentadas pela Blizzard para o Retail 12.x, lidas fora
-- de combate no login. Nada de combate, chat, amigos ou guilda.
local ADDON, ns = ...

-- GetCurrentRegion(): 1 = US (inclui Brasil e Oceania), 2 = KR, 3 = EU, 4 = TW, 5 = CN.
local REGIONS = { [1] = "us", [2] = "kr", [3] = "eu", [4] = "tw", [5] = "cn" }

local function safe(fn, ...)
  if type(fn) ~= "function" then return nil end
  local ok, a, b, c, d = pcall(fn, ...)
  if ok then return a, b, c, d end
  return nil
end

function ns.ReadRegion()
  local id = safe(GetCurrentRegion)
  return REGIONS[id]
end

function ns.ReadClient()
  local version, build, _, interface = safe(GetBuildInfo)
  return { version = version, build = build, interface = interface }
end

-- Momento (epoch, segundos) do próximo reset semanal segundo o próprio jogo.
-- Se a função não existir nesta versão, fica nil e o site usa a estimativa dele.
function ns.ReadWeeklyResetAt()
  if not C_DateAndTime or type(C_DateAndTime.GetSecondsUntilWeeklyReset) ~= "function" then return nil end
  local seconds = safe(C_DateAndTime.GetSecondsUntilWeeklyReset)
  if type(seconds) ~= "number" or seconds < 0 then return nil end
  return time() + math.floor(seconds)
end

function ns.ReadCharacter()
  local guid = safe(UnitGUID, "player")
  local name = safe(UnitName, "player")
  if type(guid) ~= "string" or type(name) ~= "string" then return nil, nil end

  local className, classFile, classId = safe(UnitClass, "player")
  local raceName, raceFile, raceId = safe(UnitRace, "player")
  local faction = safe(UnitFactionGroup, "player")

  return guid, {
    name = name,
    realm = safe(GetRealmName),
    realmSlug = safe(GetNormalizedRealmName),
    level = safe(UnitLevel, "player"),
    classId = classId,
    className = className,
    classFile = classFile,
    raceId = raceId,
    raceName = raceName,
    faction = faction,
    observedAt = time(),
  }
end
