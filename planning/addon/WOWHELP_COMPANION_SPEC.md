# WoWHelp Companion | Technical specification

**Target:** World of Warcraft Retail. **Implementation:** Lua + `.toc`. **Status:** specification, not executable addon.

## File proposal

```text
WoWHelpCompanion/
  WoWHelpCompanion.toc
  Core.lua
  CollectionAdapters.lua
  CharacterAdapter.lua
  UI.lua
  Migrations.lua
  README.md
```

## Manifest requirements

`.toc` must define `## Interface` using the version read from the installed Retail client / current addon docs, not a guessed historical value. Define unique `## SavedVariables: WoWHelpCompanionDB`, title, notes and version. Avoid dependency on other addons for MVP.

## Payload versioning

`WoWHelpCompanionDB = { schemaVersion = 1, addonVersion = "0.1.0", lastObservedAt = 0, characters = {} }`. Add migrations for schema versions. IDs should include region/realm and official identifiers when API supplies them. Do not store OAuth credentials, personal identifiers unrelated to gameplay, combat secrets, chat logs, friends or guild chat.

## Lifecycle

1. `ADDON_LOADED`: initialize loaded SavedVariables and migration.
2. `PLAYER_LOGIN`: inspect permitted character metadata.
3. `PLAYER_LOGOUT`: finalize snapshot metadata.
4. `/wowhelp`: show version, collection capabilities, last update and instruction to `/reload` or logout.

Events and APIs are a proposed architecture, subject to testing against Retail 2026. Never access secret combat values or attempt protected actions.

## Bounded data

Use allowlist of supported fields; record field availability. Limit tables, counts, nesting and historical snapshots to avoid growth and file parsing issues. Debug logs opt in and free of player private information.

## QA

Client start, relog, `/reload`, realm switch, corrupted SavedVariables, locale enUS/ptBR, disabled permission/API, recent patch and user deletion.

## Delivery

Commit source plus an installable zip later, test it locally, provide compatibility matrix and version. The plan package does not falsely claim an addon executable is already present.
