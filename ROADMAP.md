# CraftMind Fishing — Sitka Sound Edition
## The Alaska Fishing Game for Minecraft

### Vision
An open-world RPG fishing game set in Southeast Alaska / Sitka Sound. Built as a Mineflayer-based bot framework on Minecraft. The kids in Sitka play Minecraft — this is their world, in their world.

---

## 📋 BUILD STATUS

### ✅ Completed

#### Core Game Engine (from previous sessions)
- [x] 3-layer fish AI cognition (reflex/model/novelty)
- [x] 3D boids simulation for fish schools
- [x] Game theory simulation engine
- [x] Workflow engine for complex fishing operations
- [x] Fleet mechanics (captain/scout/tanker/support)
- [x] Fishing company tycoon layer
- [x] Boat upgrades and dynamic market
- [x] Crew recruitment
- [x] 12 fishing methods (original generic versions)
- [x] Gear crafting system (basic)
- [x] Skill trees
- [x] Weather system (basic)
- [x] 65+ tests

#### Sitka Sound World (2026-03-25 Session 1)
- [x] `src/world/sitka-sound.js` — 10 biomes, 16 landmarks, real SE Alaska geography
- [x] `src/world/tides.js` — 6-block tidal range, 20-min gameplay cycle, spring/neap tides
- [x] `src/world/weather-se.js` — Alaska weather (rain 35%), williwaws, glacier winds, banana belt days, 4 seasons
- [x] `src/world/sitka-species.js` — 49 Alaska species with scientific names, real weights
- [x] `src/world/landmarks.js` — 12 discoverable locations with hints
- [x] `src/world/map-renderer.js` — ASCII minimap, full map, depth map

#### Alaska Fishing Gear & Crafting (2026-03-25 Session 1)
- [x] `src/gear/alaska-gear.js` — 80+ real gear items across 8 categories
- [x] `src/gear/crafting-system.js` — 70+ recipes, 5 tiers, 6 workstations
- [x] `src/gear/gear-durability.js` — Wear/tear, environment corrosion, fish damage
- [x] `src/gear/gear-shop.js` — "Sitka Marine Supply" NPC shop
- [x] `src/gear/equipment-loadout.js` — 8-slot loadout management, 8 presets
- [x] `src/quests/fishing-quests.js` — 28 quests (8 gear, 12 story, 8 skill)

#### Alaska Fishing Methods & Boats (2026-03-25 Session 1)
- [x] `src/methods/seining.js` — Purse seine with crew roles, 6 phases
- [x] `src/methods/longlining.js` — Halibut longline with sleeper shark attacks
- [x] `src/methods/pot-fishing.js` — Dungeness/king crab with regs and size limits
- [x] `src/methods/dinglebar.js` — Lingcod jigging, THE LINGCOD PROBLEM
- [x] `src/methods/trolling-salmon.js` — 5-line spread with downriggers
- [x] `src/methods/dive-fishery.js` — Sea cucumber (easy) + geoduck (hard)
- [x] `src/methods/king-crab-boat.js` — Deadliest Catch: hazards, fatigue, quota race
- [x] `src/methods/river-fishing.js` — 4 locations (Indian River, Blue Lake, Deer Lake, Hidden Lake)
- [x] `src/boats/alaska-boats.js` — 8 boat types from skiff to 107ft crabber

### 🔄 In Progress (2026-03-25 Session 2)

#### Marine Mammals & Predation
- [ ] `src/wildlife/marine-mammals.js` — 15 whale/seal/porpoise/otter species
- [ ] `src/wildlife/predation-system.js` — Sea lions steal fish, shark bite-offs, orca scares
- [ ] `src/wildlife/wildlife-encounters.js` — Encounter events (common→legendary)
- [ ] `src/wildlife/bear-system.js` — Brown/black bears at salmon runs
- [ ] `src/wildlife/birds.js` — Seabirds as fish finders

#### Alaska Economics & Market
- [ ] `src/economy/ex-vessel-prices.js` — Real CFEC-based prices for all species
- [ ] `src/economy/market-simulation.js` — Dynamic supply/demand, random events
- [ ] `src/economy/cfec-data.js` — Real fishery statistics (permit holders, earnings, values)
- [ ] `src/economy/permit-system.js` — Commercial fishing permits ($250K seine, $2M king crab IFQ)
- [ ] `src/economy/financial-tracking.js` — Full business management (fuel, ice, bait, crew, taxes)
- [ ] `src/economy/fish-ticket.js` — Legal fish ticket recording system

#### NOAA Integration & Regulations
- [ ] `src/data/noaa-data-layer.js` — NOAA API proxy with caching + fallback data
- [ ] `src/data/fallback-data.js` — Realistic pre-generated Sitka tides/weather/buoy/catch data
- [ ] `src/data/noaa-enc-interface.js` — ENC chart backend for world generation
- [ ] `src/regulations/alaska-regulations.js` — Real ADF&G sport + commercial regs
- [ ] `src/regulations/game-warden.js` — Enforcement, fines, inspections
- [ ] `src/data/noaa-api-proxy.js` — API caching layer
- [ ] `src/species/expanded-species.js` — 25+ additional species

#### Town of Sitka (NEW)
- [ ] `src/world/sitka-town.js` — Town layout from Google Places data
- [ ] `src/world/sitka-npcs.js` — NPCs at real Sitka locations
- [ ] Buildings, shops, dock, airport, schools, churches mapped to Minecraft

#### Stable Diffusion for Asset Generation (NEW)
- [ ] `src/ai/sd-generator.js` — Block textures, mob skins, NPC faces
- [ ] Models: small SD variant optimized for Jetson 8GB ARM64

### 📋 Planned (Not Started)

#### NPC AI & Social System
- [ ] Tlingit elder NPC (quest giver, stories, culture)
- [ ] Fisherman NPCs at Ernie's Old Time Saloon (tips, rumors, stories)
- [ ] Harbor master NPC (permits, regulations, announcements)
- [ ] ADF&G biologist NPC (species info, conservation education)
- [ ] Rival fishermen (competitive AI)
- [ ] NPC daily routines (go to bars, work boats, shop at LFS Marine)

#### Salmon Lifecycle System
- [ ] Spawn → ocean → return → river run → spawning → death cycle
- [ ] Hatchery operations (buy fry, helicopter stocking to Deer Lake)
- [ ] Salmon run events with bears, eagles, player fishing
- [ ] Run strength varies by year (simulated)

#### Advanced World Generation
- [ ] NOAA ENC S-57 parser (depth polygons → biomes, coastlines → islands)
- [ ] Tile-based loading (load ENC cells as player sails to new areas)
- [ ] Procedural terrain on top of real depth data
- [ ] Underwater caves, wrecks, kelp forest structures

#### Multiplayer & Fleet Operations
- [ ] Multiple players in same Minecraft world
- [ ] Fleet coordination (seine crew, longline team)
- [ ] Player-owned boats with custom builds
- [ ] Harbor moorage system (rent a slip)

#### Education & Science
- [ ] Biology lessons embedded in gameplay (species identification, lifecycle)
- [ ] Oceanography (tides, currents, temperature, salinity)
- [ ] Fisheries management (quotas, IFQ, emergency orders, conservation)
- [ ] Economics (supply/demand, permit values, business management)
- [ ] Alaska Native culture (Tlingit fishing traditions, fish traps, language)

#### Tycoon Deepening
- [ ] Buy property in Sitka (house, dock, warehouse)
- [ ] Hire crew long-term (relationships, skills, wages)
- [ ] Upgrade boat (engine, hull, electronics, hold capacity)
- [ ] Season planning (which fishery to target, when to be where)
- [ ] Multi-year career (permits appreciate, reputation builds, seasons cycle)
- [ ] Retire as a Sitka fishing legend (endgame)

#### Content Expansion
- [ ] More areas: Juneau, Ketchikan, Petersburg, Wrangell, Glacier Bay
- [ ] Bering Sea expansion (king crab, opilio crab, pollock)
- [ ] Aleutian Islands (offshore species, extreme weather)
- [ ] Seasonal events (4th of July parade, herring spawn, silver salmon derby)
- [ ] Achievements: complete all 5 salmon species in a day, catch 100lb halibut, etc.

---

## 🏗️ Architecture

```
craftmind-fishing/
├── src/
│   ├── world/          # Geography, biomes, tides, weather, landmarks
│   ├── species/        # Fish and wildlife databases
│   ├── methods/        # 12+ fishing methods
│   ├── boats/          # Boat types and upgrades
│   ├── gear/           # Gear items, crafting, durability, shop, loadouts
│   ├── wildlife/       # Marine mammals, birds, bears, predation
│   ├── economy/        # Prices, market, permits, finance, fish tickets
│   ├── regulations/    # ADF&G rules, enforcement
│   ├── quests/         # RPG quest system
│   ├── ai/             # Stable Diffusion, NPC AI
│   ├── data/           # NOAA integration, fallback data
│   ├── town/           # Sitka town layout and NPCs (NEW)
│   └── fishing-methods.js  # Original generic methods (deprecated)
├── tests/
├── docs/
├── examples/
└── data/               # Static data files (species, prices, maps)
```

## 🔑 Key Technical Decisions
- ESM Node.js throughout (`"type": "module"`)
- Mineflayer for Minecraft bot connection
- z.ai API (glm-4.7-flash) for LLM brain
- RCON for server commands
- Google Places API for real Sitka town data
- NOAA APIs for weather/tides (with offline fallback)
- Stable Diffusion for Minecraft asset generation (Jetson 8GB ARM64)

## 🔑 Key Design Decisions
- "Slightly unrealistic" — real about gear/methods/depths, creative with easter eggs
- Kids-first — fun matters more than perfect realism
- Educational by accident — real fishery economics, biology, regulations embedded in gameplay
- Sitka-authentic — someone from Sitka should smile, not cringe
- The moat is the comparative dataset (CFEC prices, ADF&G regs, NOAA data)

## 🐛 Known Bugs
- [ ] `fish-ai.js` spook method bug (pre-existing)

## 📁 Key Paths
- Local: `/home/lucineer/projects/craftmind-fishing/`
- Repo: `github.com/CedarBeach2019/craftmind-fishing`
- Bot: `/home/lucineer/projects/craftmind/bot.js`
- Server: `/home/lucineer/projects/craftmind/server/`

## 📊 Real Sitka Data (Google Places API)
See `docs/sitka-places.md` for full categorized listing of real Sitka businesses and locations.
