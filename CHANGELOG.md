# Changelog

All notable changes to CraftMind Fishing will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Player welcome system with randomized greetings on spawn
- Comprehensive in-game help command (`!help`) showing all available commands
- In-game chat commands for playtesting (`!status`, `!mood`, `!energy`, `!chattiness`)
- Sliding window chat rate limiter (7 messages per 30 seconds, burst 3 per 3 seconds)
- Script hot-swapping via `!scripts` and `!script <name>` commands
- Mood system controls for manual override of energy, happiness, and chattiness
- Stuck detection system with 3-level recovery (position check, timeout, forced exit)
- Night shift v3 daemon with CJS rewrite for ESM compatibility
- RCON preloading at module scope for reliable spawn supply

### Fixed
- Force exit on disconnect (double exit for reconnect race conditions)
- RCON port configuration — using `rconPort` for WorldManager instead of default 25575
- Apply pinned script on initial load, not just rotation
- Chat rate limiting to prevent spam and server kicks
- Bot reconnection issues with exponential backoff

### Changed
- Plugin load sequence documentation and critical timing requirements
- Script format specification with stricter rules (FISH EVERY LOOP)
- Chat cooldown enforcement with jitter (3s + 1.5s random)
- Spawn greeting timing randomized (3-8 seconds after spawn)

### Technical
- ESM project structure (package.json: `"type": "module"`)
- CJS module imports via `createRequire()` for legacy dependencies
- Plugin load sequence: register SPAWN handler BEFORE any `await`
- Script registry auto-discovers scripts matching `/^v[0-9]+-.*\.js$/`
- 22 personality scripts across 4 versions (v1-v4)

## [1.0.0] - 2026-03-26

### Added
- Initial release of CraftMind Fishing plugin
- 22 personality scripts (10 v1, 3 v2, 5 v3, 4 v4)
- Script execution engine with step types (fish, chat, wait, branch, goto, action, set, noop)
- Mood system with energy, happiness, chattiness, and speed variables
- Sitka Sound simulation (weather, tides, species, ecosystem)
- RCON integration for automatic gear supply
- Minecraft fishing mechanics with 90-second timeout
- In-game command system (!fish, !reel, !check, !help, !status, !scripts, !script, !mood, !energy, !chattiness)
- Chat rate limiting (7/30s sliding window, 3/3s burst)
- Stuck detection with 3-level recovery
- Telemetry system for script performance comparison
- 226 passing tests

### Features
- Hot-swappable personality scripts mid-game
- Script registry auto-discovers and loads personality scripts
- Mood-aware chat frequency and fishing speed
- Energy drains 0.0002/tick, recovers 0.05 on fish catch
- Bot assignment configuration via `config/bot-assignments.json`
- Full cluster restart script (`scripts/full-restart.sh`)
- Playtest mode for single-server testing
- Comparative script evaluation tools

### Documentation
- Comprehensive README with architecture diagrams
- Script development guide with step types and rules
- Personality script reference with descriptions and hypotheses
- CLAUDE.md for Claude Code agent orchestration
- Testing guidelines and contribution workflow

### Infrastructure
- Night shift daemon for auto-recovery (BROKEN — needs CJS rewrite)
- Telemetry system for per-server stat files
- RCON retry logic with 3 attempts and 2s delay
- Spawn greeting system with randomized timing
- Player welcome messages with `!help` prompt

---

## Commit Categories

### Features (feat)
- Player welcome + help command
- In-game chat commands for play testing (!status, !mood, !energy, !chattiness)
- Sliding window chat rate limiter (7/30s, burst 3/3s)
- Night-shift v3 daemon (CJS rewrite)
- Stuck detection system with 3-level recovery
- Script hot-swapping via !scripts and !script <name>

### Fixes (fix)
- Force exit on disconnect (double exit for reconnect race)
- Use rconPort for WorldManager instead of default 25575
- Apply pinned script on initial load, not just rotation
- Preload Rcon at module scope for reliable spawn supply
- RCON retry already implemented for connection failures

### Documentation (docs)
- Add CLAUDE.md for Claude Code agent orchestration
- Comprehensive README with architecture diagrams and script reference
- CHANGELOG.md with commit history organized by category

### Refactoring (refactor)
- Plugin load sequence optimization
- Script registry auto-discovery pattern matching
- Chat rate limiter implementation (sliding window)

### Testing (test)
- 226 passing tests across all modules
- Playtest mode for manual testing
- Comparative script evaluation framework

---

## Version Schema

- **Major version (X.0.0):** Breaking changes, architecture redesigns
- **Minor version (0.X.0):** New features, personality scripts, commands
- **Patch version (0.0.X):** Bug fixes, documentation, minor improvements

## Release Notes

### v1.0.0 Highlights
- **22 Personality Scripts:** From aggressive fishers to contemplative philosophers
- **Hot-Swappable Personalities:** Change bot behavior mid-game with `!script <name>`
- **Mood System:** Energy, happiness, chattiness affect bot behavior
- **Sitka Sound Simulation:** Realistic Alaska fishing ecosystem
- **A/B Testing Framework:** Compare script performance head-to-head
- **Chat Rate Limiting:** Sliding window prevents spam (7/30s, burst 3/3s)
- **Auto-Recovery:** Stuck detection with 3-level recovery system

### Known Issues
- Night shift daemon needs CJS rewrite for ESM compatibility
- Some scripts may skip fishing in certain edge cases (violates FISH EVERY LOOP rule)
- RCON connection failures not always handled gracefully
- Mood system variables not persisted across bot restarts

### Future Work
- [ ] Fix night shift daemon for ESM compatibility
- [ ] Add script performance metrics dashboard
- [ ] Implement script evolution based on telemetry
- [ ] Add weather-reactive personality variants
- [ ] Create script template generator
- [ ] Build web-based script comparison tool
- [ ] Add more v4 refined personality scripts
- [ ] Implement script hypothesis validation framework
