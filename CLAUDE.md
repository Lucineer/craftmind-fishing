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

## Current State (2026-03-26)

### Bot Configuration
- **Active Bots:** 3 (Cody_A, Cody_B, Cody_C)
- **Default Scripts:**
  - Cody_A → `pure_fisher` (v4 baseline)
  - Cody_B → `veteran_fisher_v2` (evolved veteran)
  - Cody_C → `nervous_fisher` (v1 jumpy personality)
- **Server Ports:**
  - Minecraft: `localhost:25565`
  - RCON: `localhost:25575`

### Personality Scripts: 22 Total
- **Version 1 (10 scripts):** aggressive, social, lazy, stoic, nervous, veteran, kid, morning, contemplative, troller
- **Version 2 (3 scripts):** veteran (improved), troller (improved), social (improved)
- **Version 3 (5 scripts):** crowd, watcher, rainy-day, storyteller, drunk-ernie
- **Version 4 (4 scripts):** pure, friendly, competitive, patient

### Recent Fixes (Last 10 Commits)
1. **feat:** Player welcome + help command — randomized spawn greetings with `!help` prompt
2. **fix:** Force exit on disconnect — double exit for reconnect race conditions
3. **fix:** Use rconPort for WorldManager — instead of default 25575
4. **feat:** In-game chat commands — `!status`, `!mood`, `!energy`, `!chattiness`
5. **fix:** Apply pinned script on initial load — not just rotation
6. **feat:** Sliding window chat rate limiter — 7/30s, burst 3/3s
7. **feat:** Night-shift v3 daemon — CJS rewrite for ESM compatibility
8. **feat:** Stuck detection system — 3-level recovery (position, timeout, forced exit)
9. **fix:** Preload Rcon at module scope — for reliable spawn supply
10. **docs:** Add CLAUDE.md — initial version

### Known Issues
- **Night Shift Daemon:** BROKEN — needs CJS rewrite for ESM compatibility
- **Script Skip-Paths:** Some scripts may skip fishing in certain branches (violates FISH EVERY LOOP rule)
- **RCON Failures:** Not always handled gracefully, may need manual retry
- **Mood Persistence:** Mood system variables not persisted across bot restarts
- **Chat Rate Limiting:** Edge cases where multiple bots trigger simultaneously

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

## In-Game Commands Reference

### Player Commands
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

### Chat Rate Limiting
- **Sliding Window:** 7 messages per 30 seconds
- **Burst Capacity:** 3 messages per 3 seconds
- **Cooldown:** 3 seconds + 1.5 seconds jitter between messages
- **Enforcement:** Applied to all bot.chat() calls via rate limiter wrapper

## Configuration

### Bot Assignments (config/bot-assignments.json)
```json
{
  "Cody_A": "pure_fisher",
  "Cody_B": "veteran_fisher_v2",
  "Cody_C": "nervous_fisher"
}
```

### Environment Variables
```bash
export RCON_PORT=25575          # RCON connection port
export MC_SERVER_PORT=25565     # Minecraft server port
```

## Tests
```bash
npm test  # runs tests/test-all.js (226 tests)
node -c src/mineflayer/fishing-plugin.js  # syntax check
```

## Infrastructure

### Night Shift Daemon
**Status:** BROKEN — needs CJS rewrite for ESM compatibility

The night shift daemon (`scripts/night-shift.js`) provides auto-recovery for crashed/stuck bots:
- Auto-detects disconnected bots
- 3-level stuck detection (position check, timeout, forced exit)
- Auto-reconnect with exponential backoff
- Per-server stat file monitoring

**To fix:** Rewrite as ESM module or use CJS import pattern with `createRequire()`.

### Telemetry System
Located at `scripts/telemetry.js` — reads per-server stat files and outputs performance summary.

**Metrics tracked:**
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
```javascript
// Default RCON port
const RCON_PORT = 25575;

// Automatic supply on spawn (5s delay):
// - 1x Fishing Rod
// - 64x Bread (for food/saturation)
```

**RCON retry logic:**
- 3 attempts with 2s delay
- Fallback to manual supply if RCON unavailable
- Logs all RCON operations for debugging

### Full Cluster Restart
```bash
./scripts/full-restart.sh
```

Stops all bots, waits for clean disconnect, restarts with fresh connections, verifies RCON connectivity.

## Development Guidelines

### Creating New Personality Scripts
1. Create file in `src/mineflayer/scripts/` matching `/^v[0-9]+-.*\.js$/`
2. Export default script object with:
   - `name`: Unique identifier
   - `description`: One-line personality summary
   - `hypothesis`: What makes this script unique/testable
   - `version`: Version number (1-4)
   - `stats`: `{ fishCaught, deaths, totalChats, uniqueChats }`
   - `steps`: Array of step objects
3. Auto-loads into registry on bot restart
4. Test with `!script <name>` mid-game

### Script Review Checklist
- [ ] Follows filename pattern `/^v[0-9]+-.*\.js$/`
- [ ] Has all required fields (name, description, hypothesis, version, stats, steps)
- [ ] FISH EVERY LOOP (no skip-paths that avoid fishing)
- [ ] Chat pickers return `null` for silence (20-40% of time)
- [ ] Branch conditions use functions, not hardcoded values
- [ ] Uses `goto` to loop back to script start
- [ ] No infinite wait loops (max 10s pauses)
- [ ] Tested in playtest session for 10+ minutes
- [ ] No duplicate chat lines within same script

### Testing Workflow
1. Run full test suite: `npm test` (all 226 tests must pass)
2. Manual playtest: `node scripts/playtest.js` (15+ minutes per script)
3. Check for memory leaks (run 2+ hours)
4. Verify chat rate limiting (no spam)
5. Test hot-swap: `!script <your-script>` mid-game
6. Compare with baseline (`v4-pure`) for fish rate

## Common Issues

### Bot Won't Connect
- Check Minecraft server is running on `localhost:25565`
- Verify RCON is enabled on port `25575`
- Check `server.properties` has:
  ```
  enable-rcon=true
  rcon.port=25575
  rcon.password=your_password
  ```

### Bot Gets Stuck
- Check position with `!status`
- Use stuck detection (auto-triggers after timeout)
- Manual recovery: `!reel` then `!fish`
- Last resort: kill and restart bot

### Chat Spam
- Verify rate limiter is active (check logs for `[ChatRateLimiter]`)
- Reduce chattiness: `!chattiness 0.3`
- Check script has sufficient `null` returns (20-40% silence)

### Script Won't Load
- Verify filename matches `/^v[0-9]+-.*\.js$/`
- Check script syntax: `node -c src/mineflayer/scripts/your-script.js`
- Ensure `export default` is used (not `module.exports`)
- Check for missing required fields (name, description, etc.)

### RCON Supply Fails
- Check RCON port is correct (`25575`)
- Verify RCON password in environment
- Check logs for `[RCON]` connection errors
- Manual supply: Give bot fishing rod and bread in-game

## Research Context

This project is informed by research from `workspace/research/minecraft-ai/`:
- **AI Personality Systems:** How distinct behavioral scripts create engaging NPC interactions
- **Player Retention:** Role of memorable chat lines and repeat engagement
- **Fishing Simulation:** Alaska Department of Fish & Game data for species, pricing, permits
- **A/B Testing Methodology:** Comparative evaluation of script performance metrics

Key research questions:
1. What personality traits increase player-bot interaction time?
2. How does chattiness affect fishing efficiency and player enjoyment?
3. Can scripted personalities create viral "watercooler moments"?
4. What is the optimal balance between fishing output and social engagement?

## Project Status

**Version:** 1.0.0
**Tests:** 226 passing
**Scripts:** 22 personality scripts
**Bots:** 3 active (Cody_A, Cody_B, Cody_C)
**Last Updated:** 2026-03-26

**Roadmap:**
- [ ] Fix night shift daemon for ESM compatibility
- [ ] Add script performance metrics dashboard
- [ ] Implement script evolution based on telemetry
- [ ] Add weather-reactive personality variants
- [ ] Create script template generator
- [ ] Build web-based script comparison tool
- [ ] Add more v4 refined personality scripts
- [ ] Implement script hypothesis validation framework
