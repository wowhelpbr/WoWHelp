-- WoWHelp Companion: coleção de montarias da conta (Diário de Montarias).
-- C_MountJournal.GetMountIDs e GetMountInfoByID não têm retorno secreto no 12.x
-- (documentação gerada pela Blizzard); mesmo assim, só lemos fora de combate.
local ADDON, ns = ...

-- Devolve a lista de mountID coletados, ou nil se a API não estiver disponível.
function ns.ReadCollectedMounts()
  if not C_MountJournal
    or type(C_MountJournal.GetMountIDs) ~= "function"
    or type(C_MountJournal.GetMountInfoByID) ~= "function" then
    return nil
  end
  local ok, ids = pcall(C_MountJournal.GetMountIDs)
  if not ok or type(ids) ~= "table" then return nil end

  local collected = {}
  for _, mountID in ipairs(ids) do
    -- O 11º retorno é isCollected.
    local okInfo, _, _, _, _, _, _, _, _, _, _, isCollected = pcall(C_MountJournal.GetMountInfoByID, mountID)
    if okInfo and isCollected == true and type(mountID) == "number" then
      collected[#collected + 1] = mountID
    end
  end
  table.sort(collected)
  return collected
end
