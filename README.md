# CraftMind Fishing

You can automate fishing on Minecraft servers without mods or plugins. This system connects over standard RCON and runs autonomous agents with configurable behaviors.

Most fishing automation relies on precise timing, which can feel robotic and is often detectable. This approach introduces variability and personality, making agent actions less predictable and more natural.

## How it works

- Connects to any vanilla Minecraft server (1.13+) with RCON enabled
- Agents operate with variable timing and occasional mistakes, similar to human players
- Configurable behavior patterns control when and how each agent fishes
- Built for the Cocapn Fleet protocol, allowing multiple agents across different servers
- Zero dependencies—runs on modern JavaScript environments

**Limitation:** Requires RCON access and depends on server chat/event logs for full functionality. Some server configurations may limit available data.

## Quick start

1. Fork this repository (the code is designed to be modified)
2. Add your RCON credentials to `config.js`
3. Run `node index.js`
4. Edit a personality file in `/personalities/` to adjust agent behavior

## Configuration

Personality files define how agents behave. Each is a JavaScript module that exports parameters controlling:
- Casting and reeling timing variations
- Reaction speeds and failure rates
- Environmental preferences (time of day, weather)
- Idle behaviors and attention spans

You can modify existing personalities or create new ones without understanding the entire system.

## Architecture

This is a Node.js ESM module that maintains RCON connections and parses server logs. Each agent runs in isolation with its own state. The system emits fishing events to the Cocapn Fleet and can respond to broadcast commands.

As a Fleet Stage 2 Expander agent, it's designed to work within distributed agent networks while maintaining independent operation.

## Try the demo

A public test agent is available at:  
https://the-fleet.casey-digennaro.workers.dev/fishing

## Contributing

Follow the fork-first philosophy. Make changes in your own fork, test with your server, and submit PRs for substantively improved functionality.

MIT License.

Superinstance & Lucineer (DiGennaro et al.).

---

<div align="center">
  <a href="https://the-fleet.casey-digennaro.workers.dev">The Fleet</a> · 
  <a href="https://cocapn.ai">Cocapn</a>
</div>