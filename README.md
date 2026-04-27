# CraftMind Fishing 🎣

You can automate fishing on Minecraft servers using the standard RCON protocol. No mods, client injections, or pixel reading. It connects directly to the server like an admin tool, with agents designed to mimic human timing.

Most basic fishing bots are easily detected. This agent uses variable behavior patterns to help avoid automatic detection.

---

## Why This Exists
Basic bots operate with perfect, repetitive timing. They get banned quickly. This agent handles the repetitive task of fishing so you can focus on other activities, using timing data and occasional errors drawn from human play patterns.

---

## How It Works
- Connects to any vanilla Minecraft server (1.13+) with RCON enabled.
- Your agent uses variable casting intervals (between 11-15 seconds), occasional missed reels (~2% of the time), and natural idle pauses.
- You configure behavior through simple JavaScript personality files.
- It speaks the Cocapn Fleet protocol, allowing you to run solo or network multiple agents.
- Zero dependencies. It runs on Cloudflare Workers or as a standalone Node.js script.

**Limitation:** Requires server RCON access and standard vanilla chat logging. It only parses default `[Server] PlayerName caught a [Fish]` messages. Custom chat formats or plugins may prevent fish detection.

---

## What Makes This Different
1.  **Server-Side Only:** It never touches your game client. All automation happens through the standard RCON admin interface.
2.  **Human-Like Timing:** Behavior profiles are built from actual human fishing session data, not arbitrary random delays.
3.  **Fork-First Design:** You own your copy. No central control, telemetry, or third-party servers.

---

## Quick Start
1.  Fork this repository.
2.  Add your server's RCON credentials to `config.js`.
3.  Run `node index.js` to start your agent.
4.  Modify files in `/personalities/` to adjust your agent's patience, reaction speed, and idle habits.

---

## Configuration
Personality files are plain JavaScript. You directly control numerical ranges for:
- Cast and reel timing variance
- Reaction speed and failure rate
- Idle behavior frequency and duration

You can create new behaviors without modifying the core connection or event parsing logic.

---

## Architecture
This is a zero-dependency script built for Cloudflare Workers. It maintains persistent RCON connections, parses server log events, and runs isolated agent state machines. It emits events to a Cocapn Fleet network but operates completely standalone if not connected.

This is a Stage 2 Expander agent for Cocapn Fleet.

---

## Try the Demo
You can watch a public test agent fish on a live server:  
https://the-fleet.casey-digennaro.workers.dev/fishing

---

## Contributing
The project follows a fork-first philosophy. Please test changes against your own server. Pull requests are welcome for bug fixes, new personality templates, or core functionality improvements.

MIT License.

Superinstance and Luc
---

## Fleet Context

Part of the Lucineer/Cocapn fleet. See [fleet-onboarding](https://github.com/Lucineer/fleet-onboarding) for boarding protocol.

- **Vessel:** JetsonClaw1 (Jetson Orin Nano 8GB)
- **Domain:** Low-level systems, CUDA, edge computing
- **Comms:** Bottles via Forgemaster/Oracle1, Matrix #fleet-ops
