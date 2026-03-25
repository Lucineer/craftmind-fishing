<p align="center">
<pre>
      /`·.¸
     /¸...¸`:·
  ¸.·´  ¸   `·.¸.·´)
: © ):´;      ¸  {
 `·.¸ `·  ¸.·´\`·¸)
     `\\´´\¸.·´

  <b>C R A F T M I N D &nbsp; F I S H I N G</b>
  AI-Powered Minecraft Fishing Ecosystem
</pre>
</p>

> _"Fishing deserves to be interesting."_

Minecraft's fishing is: **cast rod → wait → reel → random loot.** Boring.

CraftMind Fishing transforms it into something alive:

- 🐟 **AI Fish** — 25 species with distinct personalities, behaviors, and decision-making
- 🌊 **Dynamic Ecosystems** — populations shift, seasons change, predator-prey dynamics play out
- 🤖 **Bot Fishermen** — autonomous bots that learn, adapt, and share knowledge
- 💰 **Living Economy** — supply and demand, dynamic pricing, achievements
- ⚔️ **Tournaments** — competitive fishing across multiple modes

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    CRAFTMIND FISHING                        │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────┐   ┌──────────┐   ┌──────────┐               │
│  │ Weather  │──▶│Ecosystem │──▶│ Fish AI  │               │
│  │  System  │   │  Engine  │   │(Decision)│               │
│  └──────────┘   └──────────┘   └────┬─────┘               │
│       │              │               │                      │
│       ▼              ▼               ▼                      │
│  ┌──────────┐   ┌──────────┐   ┌──────────┐               │
│  │   Rod    │   │  Bait &  │   │  Fish    │               │
│  │  System  │   │  Lures   │   │ Species  │               │
│  └──────────┘   └──────────┘   └──────────┘               │
│                      │                                      │
│                      ▼                                      │
│  ┌──────────┐   ┌──────────┐   ┌──────────┐               │
│  │Economy & │◀──│   Bot    │──▶│Tournament│               │
│  │Achievements│ │Fisherman │   │  System  │               │
│  └──────────┘   └──────────┘   └──────────┘               │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## Species Catalog

| Rarity | Species |
|--------|---------|
| ⬜ Common | 🐟 Overworld Carp · 🫠 Magma Minnow · 🐠 Minnow Fry · 🌈 Tropical Fry · 🐛 Insect Larva |
| 🟩 Uncommon | 🐟 River Pike · 💎 Prismarine Cod · 🍄 Spore Bass · 🌸 Coral Beauty · ❄️ Frozen Char · 🟢 Slime Trout · 🏜️ Desert Pupfish · 🪨 Cave Salmon |
| 🟦 Rare | 🔥 Nether Trout · 🦑 Glow Squid Bass · 🦐 Shulker Shrimp · ⚡ Redstone Eel |
| 🟪 Epic | 🟣 Ender Perch · 🌊 Deep Sea Angler · 🌿 Jungle Arapaima · 👻 Phantom Ray |
| 🟧 Legendary | 👁️ Warden Catfish · 🔱 Elder Guardian Marlin · 🐉 Ender Dragon Koi · 👻 Ghast Sturgeon |

Each fish has a **personality** — the Ghast Sturgeon is "Ancient and sorrowful. Its tears become magma cream." The Overworld Carp is "Patient and unassuming. The carp has seen empires rise and fall and still doesn't care."

## Quick Start

```bash
# Install (no dependencies required — pure Node.js)
git clone https://github.com/CedarBeach2019/craftmind-fishing.git
cd craftmind-fishing

# Run tests
npm test

# Run standalone demo (no Minecraft needed)
npm run demo

# Run bot tournament demo
npm run bot-demo
```

## 🎣 Play Testing with Minecraft

The fishing system now has full **Mineflayer integration** via CraftMind Core. Connect a bot to a real Minecraft server and fish in Sitka Sound.

### Prerequisites
- Minecraft server running on `localhost:25565`
- [CraftMind Core](../craftmind) installed alongside this repo
- Node.js 18+

### Starting a Playtest

```bash
node scripts/playtest.js
# or if the server is already running:
node scripts/playtest.js --no-server
```

### Fishing Commands

| Command | Aliases | Description |
|---------|---------|-------------|
| `!fish [method]` | `!cast`, `!f` | Cast and start fishing |
| `!reel` | `!haul` | Haul back your catch |
| `!check` | — | Show fishing status, weather, tides, inventory |
| `!sell [all\|<species>]` | — | Sell fish from your hold |
| `!gear [buy <id>]` | — | Check/buy fishing gear |
| `!weather` | — | Check current weather conditions |
| `!tide` | — | Check tidal conditions |
| `!radio` | — | Check marine radio chatter |
| `!permit [buy <id>]` | — | Check/buy fishing permits |

### What's Implemented
- ✅ Game engine with weather, tides, economy, wildlife, NPCs
- ✅ 9 fishing commands via CraftMind plugin system
- ✅ Fishing state machine (IDLE → CASTING → REELING → FIGHTING → LANDING)
- ✅ Inventory hooks for fish and gear tracking
- ✅ World awareness (biome detection, water proximity)
- ✅ LLM brain prompt fragment for natural fishing conversation
- ✅ Onboarding system (Old Thomas welcome, tutorial quest, starting gear)
- ✅ 39 playtest tests passing

### Known Issues
- Game engine runs in-head (no actual Minecraft rod casting yet — uses chat commands)
- Permit IDs in the game engine may not match `PERMIT_TYPES` exactly
- Onboarding `setTimeout` phases don't execute in headless tests
- Playtest launcher (`scripts/playtest.js`) requires the server to be pre-started

### TODO
- Actual Mineflayer `useEquipment` to cast real fishing rods
- Fish entity spawning as Minecraft armor stands/mobs
- Visual fishing bobber and bite detection
- RCON integration for server-side commands (teleport, gamemode, give items)
- NPC entities as Minecraft villagers with custom names
- World generation for Sitka Sound terrain

## API Overview

```js
import { CraftMindFishing, FishingRod, Bait } from './src/index.js';

// Create the system
const fishing = new CraftMindFishing();

// Add water bodies
fishing.addWater('village_pond', 'plains', { maxDepth: 5 });
fishing.addWater('nether_lake', 'basalt_deltas', { maxDepth: 8 });

// Create a bot fisherman
const bot = fishing.createBot('Angler3000', {
  rod: new FishingRod('diamond', { lure: 3, luck_of_the_sea: 2 }),
  baitInventory: [new Bait('glow_berries', { stackSize: 32 })],
});

// Fish!
fishing.tick(60000);
const result = bot.fish(fishing.ecosystem, 'village_pond', fishing.weather, fishing.ecosystem.getTimeOfDay());

if (result.success) {
  console.log(`Caught: ${result.caught.species.emoji} ${result.caught.species.name} — ${result.caught.weight}kg`);
}
```

## Modules

### `fish-species.js` — Species Registry
25 species with rarity tiers, biome preferences, fight stats, and special abilities.

### `fish-ai.js` — Fish Intelligence
Each fish has hunger, curiosity, aggression, fear. They **decide** whether to bite. They get spooked. They have fight patterns.

### `ecosystem.js` — Dynamic Ecosystem
Persistent populations. Predator-prey dynamics. Seasonal migration. Water quality. Overfishing consequences.

### `rod-system.js` — Rod Progression
6 tiers (Wooden → Ender). Enchantments (Luck of the Sea, Lure, Unbreaking, Mending). Durability and breakage.

### `bait-system.js` — Bait & Lures
20 bait types with species effectiveness. Freshness decay. 4 special lures (Attraction, Camouflage, Trophy, Patience).

### `weather-system.js` — Environment
Rain, thunder, moon phases, temperature. Weather affects bite rates and rare fish spawns.

### `bot-fisherman.js` — AI Fishermen
Bots autonomously fish, learn from experience, share knowledge with other bots, and manage inventory.

### `tournament.js` — Competitive Fishing
4 modes: Speed Fishing, Trophy Hunt, Species Collection, Total Weight. Persistent leaderboards.

### `economy.js` — Fish Economy
Dynamic pricing, cooking recipes (6 tiers), 11 achievements, supply/demand mechanics.

## Design Philosophy

> Fishing in Minecraft is one of the most anticlimactic mechanics in gaming. You cast, you wait, you get a random number. There's no skill, no strategy, no story.

> We believe fishing can be a **window into a living world**. When you pull a Ghast Sturgeon from a lava pool during a thunderstorm on a full moon, you should feel like you've accomplished something extraordinary. When you learn that Glow Berries work best for Prismarine Cod at night — through your own experimentation — that knowledge should feel earned.

> Every fish has a personality. Every body of water has a history. Every cast is a decision with consequences.

**That's why fishing deserves to be interesting.**

## License

MIT © 2026
