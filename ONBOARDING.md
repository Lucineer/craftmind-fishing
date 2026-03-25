# ONBOARDING — CraftMind Fishing: Sitka Sound Edition

**Start here.** This file gets you oriented fast after any context break.

## What Is This?
A Minecraft-based open-world fishing RPG set in Southeast Alaska / Sitka Sound. Built with Mineflayer (Node.js bot framework) connected to a local Minecraft server. The target audience is kids in Sitka, Alaska who already play Minecraft.

## Quick Start
```bash
# Server
cd ~/projects/craftmind/server && java -Xmx1G -Xms512M -jar server.jar nogui

# Bot
cd ~/projects/craftmind && source .env && node bot.js localhost 25565 Cody
```

## Project Layout
- **Core bot**: `/home/lucineer/projects/craftmind/` (CraftMind Core)
- **Fishing game**: `/home/lucineer/projects/craftmind-fishing/`
- **Other repos**: `craftmind-studio`, `craftmind-courses`, `craftmind-researcher`, `craftmind-herding`, `craftmind-circuits`, `craftmind-ranch`

## The Big Picture
8 interconnected repos make up the CraftMind Ecosystem. Fishing is the flagship. See `ROADMAP.md` for full build status and planned features.

## What's Built So Far (2026-03-25)
- **Sitka Sound world**: 10 biomes, 16 landmarks, tides, Alaska weather, 49 species
- **8 fishing methods**: seining, longlining, pot fishing, dinglebar, trolling, diving, king crab, river
- **80+ gear items**: real Alaska gear with 70+ crafting recipes
- **28 quests**: story quests with Alaska narrative + skill challenges
- **8 boat types**: skiff to 107ft crab boat
- **In progress**: marine mammals, economics, regulations, Sitka town, SD asset generation

## Key Files to Read
| Want to understand... | Read this |
|----------------------|-----------|
| The world map | `src/world/sitka-sound.js` |
| What fish live here | `src/world/sitka-species.js` |
| How fishing works | `src/methods/` (any file) |
| What gear is available | `src/gear/alaska-gear.js` |
| How to craft gear | `src/gear/crafting-system.js` |
| The quests | `src/quests/fishing-quests.js` |
| The boats | `src/boats/alaska-boats.js` |
| Tides & weather | `src/world/tides.js`, `src/world/weather-se.js` |
| Full build plan | `ROADMAP.md` |

## API Keys & Services
- **LLM**: `ZAI_API_KEY` → `https://api.z.ai/api/coding/paas/v4/chat/completions` (glm-4.7-flash)
- **Vision**: `zai/glm-4.6v` (unreliable — timeouts)
- **Google Places**: `GOOGLE_PLACES_API_KEY` (for Sitka town data)
- **Web search**: Broken (no XAI_API_KEY), web_fetch works

## Hardware Constraints
- Jetson Orin Nano 8GB, ARM64, Ubuntu 22.04, JetPack 6.2.1
- No Ubuntu upgrade (breaks GPU drivers)
- No sudo from AI (user runs sudo commands)
- 7.4GB RAM total, ~665MB available (tight for heavy models)

## Real Sitka Data Sources
- Google Places API → real businesses/locations for town generation
- CFEC (cfec.state.ak.us) → fishery economics, permit values, earnings
- NOAA → tides, weather, buoy data, ENC charts, species info
- ADF&G → regulations, species, catch data, emergency orders

## Style & Tone
- This is Alaska. Real gear, real methods, real places.
- Slightly unrealistic is fine (lobster easter eggs, bluefin tuna, narwhal) but depths and gear should be authentic
- Fun > perfection. If something isn't fun, it can be a quest that gets passed by.
- Educational by accident — kids learn about fisheries, economics, biology without realizing it
- Someone from Sitka should smile reading the species list and gear descriptions

## Known Bugs
- `fish-ai.js` has a spook method bug (pre-existing, not yet fixed)
