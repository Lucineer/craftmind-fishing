# CraftMind Fishing — Claude Code Agent Prompt

You are working on **craftmind-fishing**, the fishing game module for CraftMind autonomous Minecraft agents.

## Critical: This is an ESM Project
```json
// package.json has: "type": "module"
// Use import/export, NOT require/module.exports
// For CJS modules (rcon-client), use:
const { createRequire } = await import('node:module');
const req = createRequire(import.meta.url);
const { Rcon } = req('rcon-client');
```

## Key Files
- `src/mineflayer/fishing-plugin.js` — Main plugin (1200+ lines). Registers on SPAWN, manages fishing game, mood system, script runner, chat handler, RCON supply.
- `src/mineflayer/script-engine.js` — Script execution engine. Step types: fish, chat, wait, look_around, equip_rod, action. Mood affects speed and chattiness.
- `src/mineflayer/scripts/registry.js` — Auto-discovers scripts matching `/^v[0-9]+-.*\.js$/`
- `src/mineflayer/scripts/*.js` — 22 personality scripts (v1 through v4)
- `src/mineflayer/minecraft-fishing.js` — Fishing mechanics, RCON integration
- `src/world/` — Sitka Sound simulation (weather, tides, species, ecosystem)
- `scripts/telemetry.js` — Reads per-server stat files, outputs summary
- `scripts/night-shift.js` — Auto-recovery daemon (BROKEN — needs CJS rewrite)
- `scripts/full-restart.sh` — One-command cluster restart

## Architecture
```
User chat → fishing-plugin.js → script-engine.js → Step execution
                                    ↓
                              Mood system (energy, happiness, chattiness, speed)
                                    ↓
                              minecraft-fishing.js → bot.fish()
```

## Plugin Load Sequence (CRITICAL)
1. `async load(ctx)` called by craftmind WITHOUT await
2. Must register SPAWN handler BEFORE any `await`
3. SPAWN handler wraps bot.chat() with rate limiter (3s + 1.5s jitter)
4. RCON gives fishing rod + bread after 5s delay
5. Spawn greeting after 3-8s (randomized)
6. Script runner starts fishing loop

## Script Format
```javascript
import { Script, Step } from '../script-engine.js';
export default new Script('script_name', 'Description', [
  Step.chat({ 0.5: 'Hello.', 0.3: 'Hey.', 0.2: null }),
  Step.fish(),
  Step.chat({ 0.5: 'Nice one!', 0.3: 'Got it!', 0.2: null }),
  Step.wait(2000),
]);
```

## Rules
- Script filename MUST match `/^v[0-9]+-.*\.js$/` (e.g., v4-pure.js)
- FISH EVERY LOOP — no script should have a branch that skips fishing
- Mood chattiness controls chat frequency (0-1 scale)
- Energy drains 0.0002/tick, recovers 0.05 on fish catch
- `bot.fish()` timeout is 90 seconds
- Chat cooldown is 5 seconds between messages
- `Date.now() - context.lastChatTime < 5000` check before chat

## Tests
```bash
npm test  # runs tests/test-all.js
node -c src/mineflayer/fishing-plugin.js  # syntax check
```
