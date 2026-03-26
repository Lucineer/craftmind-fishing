# 🎣 CraftMind Fishing

> Sitka Sound open-world RPG — the most realistic fishing game in Minecraft.

[![226 tests](https://img.shields.io/badge/tests-226%20passing-brightgreen)]()
[![Node.js](https://img.shields.io/badge/node-%3E%3D18-blue)]()
[![License: MIT](https://img.shields.io/badge/license-MIT-green)]()

## Overview

CraftMind Fishing transforms Minecraft's anticlimactic fishing mechanic into a living, breathing simulation of Alaska's commercial fisheries. Set in Sitka Sound — a real fishing community in Southeast Alaska — players captain boats through dynamic weather, navigate tides, identify 70+ real fish species by their actual behavior, and compete in a living economy driven by the same permit systems that govern real Alaskan waters.

The game is built on real science. Species distributions, ex-vessel pricing, CFEC permit tiers, and seasonal migrations are modeled on actual Alaska Department of Fish & Game data. Kids don't realize they're learning oceanography, economics, and marine biology — they're just trying to fill their hold before the storm hits.

Everything runs as a [CraftMind Core](https://github.com/CedarBeach2019/craftmind) plugin, so you can drop it into any bot and fish alongside your crew in a shared world.

## Features

### 🐟 Marine Life
- **70+ real Alaska fish species** with accurate AI behavior, fight patterns, and habitat preferences
- **Marine mammals** — humpback whales, sea lions, orcas with predation mechanics and random encounters
- **Dynamic populations** that shift with seasons, overfishing pressure, and predator-prey dynamics

### 🌊 Environment
- **Dynamic weather system** — rain, wind, fog, visibility, and sea state affecting bite rates
- **Realistic tidal cycles** with 6-hour ebb and flood, impacting access to fishing grounds
- **Ocean biomes** — kelp forests, deep channels, shallow flats, each with distinct species assemblages

### 🎣 Fishing
- **8 fishing methods** — troll, seine, longline, dive, pot, cast, drift, and sport
- **Rod & gear progression** — 6 tiers from Wooden to Ender, with enchantments, durability, and breakage
- **20+ bait types** with species effectiveness, freshness decay, and 4 special lures
- **Fishing state machine** — IDLE → CASTING → REELING → FIGHTING → LANDING

### 💰 Economy
- **Real CFEC permit system** — Limited Entry, Guided Sport, Crew, Subsistence tiers
- **Ex-vessel pricing** based on actual Alaska fish market data
- **Dynamic supply and demand** — sell too much king salmon and watch the price crash
- **Fishing company management** — hire crew, buy boats, manage contracts

### 🏘️ World
- **Town of Sitka** with 40+ buildings, 11 NPCs with dialogue, and 3 harbors
- **Marine radio** with weather broadcasts, fishery bulletins, and distress calls
- **Quest system** — tutorial quest with Old Thomas, achievement tracks, skill trees
- **Crew roles** — Deckhand, Engineer, Navigator, Cook — each with unique abilities

### 🎮 Playable
- **Full playtest mode** — `node scripts/playtest.js` spawns a bot in Sitka Sound
- **9 in-game commands** via CraftMind plugin system
- **Biology lessons** — fish identification cards, habitat education, bycatch awareness

## Quick Start

```bash
git clone https://github.com/CedarBeach2019/craftmind-fishing.git
cd craftmind-fishing
npm install

# Run the test suite
npm test

# Run the standalone demo (no Minecraft needed)
npm run demo

# Playtest with a Minecraft server
node scripts/playtest.js
```

### Prerequisites for Playtest

- Minecraft server running on `localhost:25565`
- [CraftMind Core](https://github.com/CedarBeach2019/craftmind) installed alongside this repo
- Node.js 18+

## Commands

| Command | Aliases | Description |
|---------|---------|-------------|
| `!fish [method]` | `!cast`, `!f` | Cast and start fishing |
| `!reel` | `!haul` | Haul back your catch |
| `!check` | — | Show fishing status, weather, tides, inventory |
| `!sell [all\|<species>]` | — | Sell fish from your hold |
| `!gear [buy <id>]` | — | Check or buy fishing gear |
| `!weather` | — | Check current weather conditions |
| `!tide` | — | Check tidal conditions |
| `!radio` | — | Check marine radio chatter |
| `!permit [buy <id>]` | — | Check or buy fishing permits |

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     CRAFTMIND FISHING                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐       │
│  │ Weather  │  │  Tides   │  │ Species  │  │  Wildlife│       │
│  │  System  │  │  Engine  │  │ Registry │  │  Engine  │       │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘       │
│       │             │             │             │              │
│       ▼             ▼             ▼             ▼              │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                    Game Engine                           │   │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐             │   │
│  │  │Ecosystem │  │ Economy  │  │   Town   │             │   │
│  │  │  Engine  │  │  Engine  │  │  Engine  │             │   │
│  │  └──────────┘  └──────────┘  └──────────┘             │   │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐             │   │
│  │  │  Rod &   │  │ Fishing  │  │  Quest   │             │   │
│  │  │  Bait    │  │ Methods  │  │ System   │             │   │
│  │  └──────────┘  └──────────┘  └──────────┘             │   │
│  └────────────────────────┬───────────────────────────────┘   │
│                           │                                    │
│              ┌────────────▼────────────┐                      │
│              │   CraftMind Core Plugin │                      │
│              └────────────┬────────────┘                      │
│                           │                                    │
│              ┌────────────▼────────────┐                      │
│              │    mineflayer bot       │                      │
│              └────────────┬────────────┘                      │
└───────────────────────────┼──────────────────────────────────┘
                            │
                   ┌────────▼────────┐
                   │ Minecraft Server│
                   └─────────────────┘
```

## Ecosystem

CraftMind Fishing is part of the CraftMind ecosystem:

| Repo | Description |
|------|-------------|
| [craftmind](https://github.com/CedarBeach2019/craftmind) | 🤖 Core bot framework |
| [**craftmind-fishing**](https://github.com/CedarBeach2019/craftmind-fishing) | 🎣 Sitka Sound fishing RPG |
| [craftmind-studio](https://github.com/CedarBeach2019/craftmind-studio) | 🎬 AI filmmaking engine |
| [craftmind-ranch](https://github.com/CedarBeach2019/craftmind-ranch) | 🐄 Animal husbandry simulation |
| [craftmind-herding](https://github.com/CedarBeach2019/craftmind-herding) | 🐑 Livestock herding AI |
| [craftmind-circuits](https://github.com/CedarBeach2019/craftmind-circuits) | ⚡ Redstone circuit design |
| [craftmind-courses](https://github.com/CedarBeach2019/craftmind-courses) | 📚 In-game learning system |
| [craftmind-researcher](https://github.com/CedarBeach2019/craftmind-researcher) | 🔬 AI research assistant |

## Assets

AI-generated textures, models, and sprites live in `assets/generated/` and are not tracked in git. To regenerate:

```bash
python3 scripts/gen-batch.py
```

## License

MIT — see [LICENSE](LICENSE).
