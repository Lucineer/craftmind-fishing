# 🎣 CraftMind Fishing

> AI-powered Minecraft fishing bots with personality A/B testing — Sitka Sound open-world RPG simulation

[![226 tests](https://img.shields.io/badge/tests-226%20passing-brightgreen)]()
[![Node.js](https://img.shields.io/badge/node-%3E%3D18-blue)]()
[![License: MIT](https://img.shields.io/badge/license-MIT-green)]()

## Overview

CraftMind Fishing is an autonomous Minecraft fishing bot system with **22+ unique personality scripts** that drive bot behavior, chat patterns, and fishing strategies. Built as a [CraftMind Core](https://github.com/CedarBeach2019/craftmind) plugin, it enables AI fishermen with distinct personalities to fish alongside human players in shared worlds.

The project combines realistic Alaska fishing simulation (Sitka Sound ecosystem, weather, tides, 70+ species) with **AI personality experimentation** — each bot runs a behavior script that determines how they fish, what they say, and how they react to catches and misses.

### Key Features

- **22 Personality Scripts** across 4 versions (v1-v4) — from aggressive fishers to contemplative philosophers
- **Hot-Swappable Scripts** — change bot personality mid-game via `!script <name>` commands
- **Mood System** — energy, happiness, chattiness, and speed variables affect behavior
- **Script Registry** — auto-discovers and loads personality scripts from `src/mineflayer/scripts/`
- **Telemetry & A/B Testing** — compare script performance head-to-head
- **Realistic Fishing** — 70+ Alaska species, weather system, tides, rod tiers, bait types
- **RCON Integration** — automatic rod/bread supply, server management
- **Stuck Detection** — 3-level recovery system for disconnected/stuck bots
- **Chat Rate Limiting** — sliding window (7/30s, burst 3/3s) prevents spam
- **Night Shift Daemon** — auto-recovery for crashed bots (CJS rewrite)

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     CRAFTMIND FISHING                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  User Chat ──► fishing-plugin.js (1200+ lines)                  │
│                   │  ┌─ Mood System (energy, happiness, etc.)   │
│                   │  ├─ Script Runner (hot-swappable)           │
│                   │  ├─ Chat Handler (rate-limited)             │
│                   │  └─ RCON Supply (auto gear)                 │
│                   ▼                                              │
│              script-engine.js                                    │
│                   │  ┌─ Step Execution (fish, chat, wait, etc.) │
│                   │  └─ Mood-aware speed/chattiness             │
│                   ▼                                              │
│          Personality Scripts (*.js)                              │
│                   ├─ v1-aggressive, v1-social, v1-lazy, ...      │
│                   ├─ v2-veteran, v2-troller, v2-social, ...      │
│                   ├─ v3-crowd, v3-watcher, v3-rainy-day, ...     │
│                   └─ v4-friendly, v4-competitive, v4-pure, ...   │
│                   ▼                                              │
│         minecraft-fishing.js                                     │
│                   │  └─ bot.fish() with 90s timeout              │
└───────────────────────────┬──────────────────────────────────────┘
                            │
                   ┌────────▼────────┐
                   │ Minecraft Server│
                   │  (RCON: 25575)  │
                   └─────────────────┘
```

### Script Engine Architecture

```
Script Definition (v4-pure.js)
       │
       ├─ name: 'pure_fisher'
       ├─ description: 'Baseline. Minimal personality, maximum fishing output.'
       ├─ hypothesis: 'r2 pure_fisher: sets the fish/min ceiling for comparison'
       ├─ version: 2
       ├─ stats: { fishCaught, deaths, totalChats, uniqueChats }
       └─ steps: [
            { type: 'fish' },                    // Cast fishing rod
            { type: 'wait', ms: 1000 },           // Pause 1 second
            { type: 'chat', pick: fn },           // Random chat line
            { type: 'branch', condition: fn,      // Conditional logic
              ifTrue: [...],
              ifFalse: [...]
            },
            { type: 'goto', scriptName: '...' }   // Loop back
          ]
```

## Quick Start

### Prerequisites

- Node.js 18+
- Minecraft server (vanilla or CraftMind-compatible)
- [CraftMind Core](https://github.com/CedarBeach2019/craftmind) (optional, for bot framework)

### Installation

```bash
git clone https://github.com/CedarBeach2019/craftmind-fishing.git
cd craftmind-fishing
npm install
```

### Running Tests

```bash
npm test                    # Run all 226 tests
node -c src/mineflayer/fishing-plugin.js  # Syntax check
```

### Playtesting with Minecraft Server

```bash
# Start your Minecraft server on localhost:25565
# Then run the playtest script
node scripts/playtest.js
```

### Bot Assignment Configuration

Edit `config/bot-assignments.json`:

```json
{
  "Cody_A": "pure_fisher",
  "Cody_B": "veteran_fisher_v2",
  "Cody_C": "nervous_fisher"
}
```

### Environment Variables

```bash
# Optional: Override default ports
export RCON_PORT=25575
export MC_SERVER_PORT=25565
```

## In-Game Commands

| Command | Description | Example |
|---------|-------------|---------|
| `!help` | Show all available commands | `!help` |
| `!status` | Display bot mood, energy, stats, weather, tides | `!status` |
| `!scripts` | List all 22 available personality scripts | `!scripts` |
| `!script <name>` | Switch bot personality (hot-swap) | `!script v4-pure` |
| `!mood <0.0-1.0>` | Set bot happiness level | `!mood 0.8` |
| `!energy <0.0-1.0>` | Set bot energy level | `!energy 0.5` |
| `!chattiness <0.0-1.0>` | Set how talkative bot is | `!chattiness 0.9` |
| `!fish` | Cast fishing rod and start fishing | `!fish` |
| `!reel` | Haul back the catch | `!reel` |
| `!check` | Show fishing status, inventory, conditions | `!check` |

## Personality Scripts (22 Total)

### Version 1 Scripts (Original 10)

| Script | Name | Description | Hypothesis |
|--------|------|-------------|------------|
| `v1-aggressive` | **Aggressive Fisher** | Minimal chat, maximum fishing. Cast, reel, repeat. | Most fish per hour due to zero idle time |
| `v1-social` | **Social Fisher** | Talks a lot, offers advice, reacts to everything. Fishing is secondary to conversation. | Most unique chat lines, engaging for human players |
| `v1-lazy` | **Lazy Fisher** | Takes lots of breaks, stretches, complains. Fishing is casual. | Most natural-feeling despite fewer fish |
| `v1-stoic` | **Stoic Fisher** | Nearly silent. Catches fish efficiently with minimal interaction. | Highest fish-per-chat ratio, players respect the quiet |
| `v1-nervous` | **Nervous Fisher** | Jumpy, anxious, always looking over his shoulder while fishing. | Most atmospheric personality, builds tension for nearby players |
| `v1-veteran` | **Veteran Fisher** | Old salt who references past seasons and gives unsolicited fishing advice. | Most memorable personality, players quote specific lines |
| `v1-kid` | **Kid Fisher** | Excited beginner who treats every moment like the best thing ever. | Most fun personality, best for kids and family gameplay |
| `v1-morning` | **Morning Fisher** | Early riser who loves dawn fishing. Gets tired and quiet by afternoon. | Best for realistic day-long sessions with natural energy curve |
| `v1-contemplative` | **Contemplative Fisher** | Quiet philosopher who finds meaning in fishing. Long pauses, deep thoughts. | Most depth and memorable quotes, appeals to reflective players |
| `v1-troller` | **Troller Fisher** | Sitka troller with real gear knowledge and local references. | Most authentic for real fishermen, educational by accident |

### Version 2 Scripts (Evolved 3)

| Script | Name | Description | Improvements |
|--------|------|-------------|--------------|
| `v2-veteran` | **Veteran Fisher v2** | Retired Sitka fisherman with decades of stories. Slow, deliberate, memorable. | Longer stories with specific historical details, seasonal/time awareness, better pacing with variable waits |
| `v2-troller` | **Troller Fisher v2** | Improved Sitka troller with more gear references and better technical accuracy. | Enhanced gear vocabulary, more realistic trolling patterns |
| `v2-social` | **Social Fisher v2** | Friendlier, more helpful social fisher with better engagement. | More advice, better reactions, increased player interaction |

### Version 3 Scripts (Advanced 5)

| Script | Name | Description | Features |
|--------|------|-------------|----------|
| `v3-crowd` | **Dock Crowd** | A group of Sitka dock regulars fishing and chatting. Multiple voices, authentic dock atmosphere. | 6 themed chat pools, gear failures, player reactions, varied pacing, 50+ unique lines |
| `v3-watcher` | **Wildlife Watcher** | Sitka naturalist who fishes but gets distracted by eagles, whales, otters. | 70% wildlife observations, 20% fishing, 10% nature philosophy, 40+ unique lines |
| `v3-rainy-day` | **Rainy Day Fisher** | Weather-grouchy fisherman who complains about conditions but keeps fishing. | More talkative in bad weather, gear adjustments, bitter-sweet reactions |
| `v3-storyteller` | **Storyteller** | Old salt who tells fishing stories, exaggerates past catches, and name-drops fish. | Narrative personality creates memorable interactions and repeat engagement |
| `v3-drunk-ernie` | **Drunk Ernie** | Tipsy dock regular who dispenses wisdom, questionable advice, and imaginary drinks. | Humorous NPC creates viral moments and memorable social interaction |

### Version 4 Scripts (Refined 4)

| Script | Name | Description | Focus |
|--------|------|-------------|-------|
| `v4-pure` | **Pure Fisher** | Baseline. Minimal personality, maximum fishing output. Sets the performance ceiling. | FISH EVERY LOOP — no skip-paths, minimal chat |
| `v4-friendly` | **Friendly Neighbor** | Chatty neighbor who greets everyone, comments on surroundings. Always fishes. | Social engagement without skip-paths maintains fishing rate |
| `v4-competitive` | **Competitive Angler** | Keeps score, celebrates milestones, trash-talks. Always fishes. | Milestone celebrations increase engagement without reducing fishing rate |
| `v4-patient` | **Patient Elder** | Slow, deliberate fisher with long pauses and occasional wisdom. Always fishes. | Longer pacing doesn't hurt fish rate, adds character depth |

## Script Development

### Creating a New Personality Script

1. Create file in `src/mineflayer/scripts/` matching pattern `/^v[0-9]+-.*\.js$/`
2. Export default script object:

```javascript
export default {
  name: 'my_fisher',
  description: 'One-line description of personality',
  hypothesis: 'What makes this script unique/testable',
  version: 1,
  stats: { fishCaught: 0, deaths: 0, totalChats: 0, uniqueChats: 0 },

  steps: [
    { type: 'chat', pick: () => 'Hello!' },
    { type: 'wait', ms: 1000 },
    { type: 'fish' },
    { type: 'branch',
      condition: () => Math.random() > 0.5,
      ifTrue: { type: 'chat', pick: () => 'Got one!' },
      ifFalse: { type: 'chat', pick: () => 'Missed.' },
    },
    { type: 'goto', scriptName: 'my_fisher' },
  ]
};
```

3. Script auto-loads into registry on next bot start
4. Switch to it mid-game: `!script my_fisher`

### Step Types

| Type | Parameters | Description |
|------|------------|-------------|
| `fish` | — | Cast fishing rod and wait for catch (90s timeout) |
| `chat` | `pick: function` | Chat line picker function (returns string or null) |
| `wait` | `ms: number` | Pause execution for milliseconds |
| `branch` | `condition, ifTrue, ifFalse` | Conditional execution |
| `goto` | `scriptName: string` | Jump to script (for loops) |
| `action` | `exec: string` | Execute bot action (look_around, equip_rod, etc.) |
| `set` | `key, value` | Set context variable |
| `noop` | — | Do nothing |

### Critical Rules

- **FISH EVERY LOOP** — No script should have a branch that skips fishing entirely
- **Filename pattern** — MUST match `/^v[0-9]+-.*\.js$/` (e.g., `v4-chatty.js`)
- **Null returns** — Chat pickers can return `null` for silence
- **Mood awareness** — Energy drains 0.0002/tick, recovers 0.05 on fish catch
- **Chat cooldown** — 5 seconds between messages (enforced by rate limiter)
- **90s timeout** — `bot.fish()` fails after 90 seconds without catch

## Infrastructure

### Night Shift Daemon (Auto-Recovery)

Located at `scripts/night-shift.js` — CJS-rewritten daemon that monitors and recovers crashed/stuck bots.

**Features:**
- Auto-detects disconnected bots
- 3-level stuck detection (position check, timeout, forced exit)
- Auto-reconnect with exponential backoff
- Per-server stat file monitoring

**Status:** BROKEN — needs CJS rewrite for ESM compatibility

### Telemetry System

Located at `scripts/telemetry.js` — Reads per-server stat files and outputs performance summary.

**Metrics tracked per bot:**
- Fish caught per session
- Total chat messages
- Unique chat lines
- Deaths and disconnects
- Script performance comparison

**Usage:**
```bash
node scripts/telemetry.js
```

### RCON Setup

The plugin uses RCON for automatic gear supply:

```javascript
// Default RCON port
const RCON_PORT = 25575;

// Automatic supply on spawn:
// - 1x Fishing Rod
// - 64x Bread (for food/saturation)
// - Delivered 5 seconds after spawn
```

**RCON retry logic:**
- 3 attempts with 2s delay
- Fallback to manual supply if RCON unavailable
- Logs all RCON operations for debugging

### Full Cluster Restart

```bash
./scripts/full-restart.sh
```

One-command cluster restart that:
1. Stops all bots gracefully
2. Waits for clean disconnect
3. Restarts all bots with fresh connections
4. Verifies RCON connectivity

## Project Structure

```
craftmind-fishing/
├── src/
│   ├── mineflayer/
│   │   ├── fishing-plugin.js      # Main plugin (1200+ lines)
│   │   ├── script-engine.js       # Script execution engine
│   │   ├── minecraft-fishing.js   # Fishing mechanics, RCON
│   │   ├── scripts/
│   │   │   ├── registry.js        # Auto-discovers personality scripts
│   │   │   ├── v1-*.js           # 10 version 1 scripts
│   │   │   ├── v2-*.js           # 3 version 2 scripts
│   │   │   ├── v3-*.js           # 5 version 3 scripts
│   │   │   └── v4-*.js           # 4 version 4 scripts
│   │   └── world/                 # Sitka Sound simulation
│   │       ├── weather.js         # Dynamic weather system
│   │       ├── tides.js           # Realistic tidal cycles
│   │       ├── species.js         # 70+ Alaska fish species
│   │       └── ecosystem.js       # Predator-prey dynamics
│   └── index.js                   # Package entry point
├── config/
│   └── bot-assignments.json       # Bot → Script mapping
├── scripts/
│   ├── playtest.js               # Launch playtest session
│   ├── telemetry.js              # Performance summary
│   ├── night-shift.js            # Auto-recovery daemon (BROKEN)
│   ├── full-restart.sh           # Cluster restart script
│   ├── compare-scripts.js        # A/B testing tool
│   └── run-experiment.js         # Experiment runner
├── tests/
│   ├── test-all.js               # Test suite runner
│   ├── test-fleet.js             # Multi-bot tests
│   ├── test-world-infrastructure.js
│   ├── test-playtest.js
│   ├── test-comparative-eval.js
│   ├── test-ai-engine.js
│   ├── test-actions.js
│   ├── test-town.js
│   ├── test-fishing-methods.js
│   ├── test-survival.js
│   └── test-integration.js
├── assets/
│   ├── species/                  # Fish species data
│   ├── items/                    # Fishing gear items
│   ├── npcs/                     # NPC dialogue
│   ├── locations/                # Sitka locations
│   └── generated/                # AI-generated assets (not tracked)
├── CLAUDE.md                     # Claude Code agent orchestration
├── CHANGELOG.md                  # Version history
├── README.md                     # This file
└── package.json
```

## Contributing

### Development Workflow

1. **Fork and clone:**
   ```bash
   git clone https://github.com/YOUR_USERNAME/craftmind-fishing.git
   cd craftmind-fishing
   npm install
   ```

2. **Create feature branch:**
   ```bash
   git checkout -b feature/my-new-script
   ```

3. **Make changes:**
   - Add new personality script to `src/mineflayer/scripts/vX-*.js`
   - Test with `npm test`
   - Syntax check with `node -c src/mineflayer/fishing-plugin.js`

4. **Run playtest:**
   ```bash
   node scripts/playtest.js
   ```

5. **Commit and push:**
   ```bash
   git add -A
   git commit -m "feat: add v5-chatty personality script"
   git push origin feature/my-new-script
   ```

6. **Pull Request:** Describe your script's hypothesis and what makes it unique.

### Script Review Criteria

- [ ] Follows filename pattern `/^v[0-9]+-.*\.js$/`
- [ ] Has `name`, `description`, `hypothesis`, `version`, `stats`
- [ ] FISH EVERY LOOP (no skip-paths that avoid fishing)
- [ ] Chat pickers return `null` for silence (20-40% of time)
- [ ] Branch conditions use functions, not hardcoded values
- [ ] Uses `goto` to loop back to script start
- [ ] No infinite wait loops (max 10s pauses)
- [ ] Tested in playtest session for 10+ minutes
- [ ] No duplicate chat lines within same script

### Testing Guidelines

- Run full test suite: `npm test` (all 226 tests must pass)
- Manual playtest: `node scripts/playtest.js` (15+ minutes per script)
- Check for memory leaks (run 2+ hours)
- Verify chat rate limiting (no spam)
- Test hot-swap: `!script <your-script>` mid-game
- Compare with baseline (`v4-pure`) for fish rate

## Research Basis

This project is informed by research from the `workspace/research/minecraft-ai/` directory:

- **AI Personality Systems:** How distinct behavioral scripts create engaging NPC interactions
- **Player Retention:** Role of memorable chat lines and repeat engagement
- **Fishing Simulation:** Alaska Department of Fish & Game data for species, pricing, permits
- **A/B Testing Methodology:** Comparative evaluation of script performance metrics
- **Mood Systems:** Energy, happiness, chattiness as engagement drivers

Key research questions:
1. What personality traits increase player-bot interaction time?
2. How does chattiness affect fishing efficiency and player enjoyment?
3. Can scripted personalities create viral "watercooler moments"?
4. What is the optimal balance between fishing output and social engagement?

## CraftMind Ecosystem

| Repo | Description |
|------|-------------|
| [craftmind](https://github.com/CedarBeach2019/craftmind) | 🤖 Core bot framework |
| [**craftmind-fishing**](https://github.com/CedarBeach2019/craftmind-fishing) | 🎣 Sitka Sound fishing RPG |
| [craftmind-studio](https://github.com/CedarBeach2019/craftmind-studio) | 🎬 AI filmmaking engine |
| [craftmind-courses](https://github.com/CedarBeach2019/craftmind-courses) | 📚 In-game learning system |
| [craftmind-researcher](https://github.com/CedarBeach2019/craftmind-researcher) | 🔬 AI research assistant |
| [craftmind-herding](https://github.com/CedarBeach2019/craftmind-herding) | 🐑 Livestock herding AI |
| [craftmind-circuits](https://github.com/CedarBeach2019/craftmind-circuits) | ⚡ Redstone circuit design |
| [craftmind-ranch](https://github.com/CedarBeach2019/craftmind-ranch) | 🌾 Genetic animal breeding |
| [craftmind-discgolf](https://github.com/CedarBeach2019/craftmind-discgolf) | 🥏 Disc golf simulation |

## License

MIT — see [LICENSE](LICENSE).

## Acknowledgments

- **Sitka Sound Community:** Inspiration from real Southeast Alaska fishermen
- **Alaska Department of Fish & Game:** Species data, permit systems, pricing models
- **CraftMind Core Team:** Bot framework and plugin architecture
- **Mineflayer Community:** Minecraft bot development tools
- **Claude Code Agents:** AI-assisted development and testing
